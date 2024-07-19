import { Resource } from "sst"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda";
import { checkIfMP3 } from "./util/fileUtil";

const s3 = new S3Client({});

export const uploadUrl: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
    const id = crypto.randomUUID() + '.mp3';

    const command = new PutObjectCommand({
        Key: id,
        Bucket: Resource.BucketConverteAudiosInputTeste.name,
        ContentType: 'audio/mpeg',
        Metadata: {
            fileName: event.headers['file-name'] || id,
        },
    });

    const url = await getSignedUrl(s3, command);

    return {
        statusCode: 200,
        body: JSON.stringify({
            id,
            url,
        }),
    };
}

export const upload: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
    const id = crypto.randomUUID() + ".mp3";

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: "No file provided",
            }
        }

        const fileContent = Buffer.from(event.body, 'base64');

        if (!(await checkIfMP3(fileContent))) {
            return {
                statusCode: 400,
                body: "File is not an mp3",
            }
        }
    
        const command = new PutObjectCommand({
            Bucket: Resource.BucketConverteAudiosInputTeste.name,
            Key: id,
            Body: fileContent,
            ContentType: 'audio/mpeg',
            Metadata: {
                fileName: event.headers['file-name'] || id,
            },
        });
        await s3.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify({ id }),
        };
    } catch (error) {
        console.error('Upload failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Upload failed' }),
        };
    }
}

export const getById: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
    const { id } = event.pathParameters;
    const command = new GetObjectCommand({
        Bucket: Resource.BucketConverteAudiosInputTeste.name,
        Key: id,
    });

    return {
        statusCode: 302,
        headers: {
            Location: await getSignedUrl(s3, command),
        },
        body: ""
    }
}
