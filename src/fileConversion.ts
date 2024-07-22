import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { readFile, rm, writeFile } from "fs/promises";
import { existsSync } from "fs";
import { Readable } from "stream";
import { checkIfMP3 } from "./util/fileUtil";
import { fileTypeFromFile } from "file-type";
import { exec } from "child_process";
import * as ffmpeg from "ffmpeg-static";
import { Resource } from "sst";
import { APIGatewayProxyResult, S3Event } from "aws-lambda";

const s3 = new S3Client({});

export const convertToWebm = async (event: S3Event): Promise<APIGatewayProxyResult> => {
  const ffmpegPath = ffmpeg.default;

  const bucketName = event.Records[0].s3.bucket.name;
  const objectKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));

  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const data = await s3.send(command);

    if (!data.Body || !(data.Body instanceof Readable)) {
      throw new Error("No data body or not readable. Should never happen");
    }

    const tempInputPath = "/tmp/input.mp3";
    const tempOutputPath = "/tmp/output.webm";

    await writeFile(tempInputPath, data.Body);
    if (existsSync(tempOutputPath)) {
      await rm(tempOutputPath);
    }

    if (!checkIfMP3(await fileTypeFromFile(tempInputPath))) {
      console.log("Not an mp3, not doing anything");
      //   console.log("Not an mp3, deleting");
      //   const commandDelete = new DeleteObjectCommand({
      //     Bucket: bucketName,
      //     Key: objectKey,
      //   });
      //   await s3.send(commandDelete);

      return {
        statusCode: 200,
        body: JSON.stringify({ message: "File was not an mp3" }),
      };
    }

    await new Promise((resolve, reject) => {
      exec(`${ffmpegPath} -i ${tempInputPath} -c:a libopus ${tempOutputPath}`, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          console.log("Conversion successful", stdout);
          resolve(undefined);
        }
      });
    });

    const uploadCommand = new PutObjectCommand({
      Bucket: Resource.BucketConverteAudiosOutputTeste.name,
      Key: objectKey.replace(".mp3", "") + ".webm",
      Body: await readFile(tempOutputPath),
      ContentType: "video/webm",
      Metadata: data.Metadata,
    });
    await s3.send(uploadCommand);

    const commandDelete = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    await s3.send(commandDelete);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Conversion successful" }),
    };
  } catch (err) {
    console.error("Error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error during conversion" }),
    };
  }
};
