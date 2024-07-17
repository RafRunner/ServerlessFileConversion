import { Resource } from "sst"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({});

export async function uploadUrl() {
    const id = crypto.randomUUID();

    const command = new PutObjectCommand({
        Key: id,
        Bucket: Resource.BucketConverteAudiosInputTeste.name,
    });

    const url = await getSignedUrl(s3, command);

    return {
        statusCode: 200,
        body: url,
    };
}

interface UploadRequest {
    body: Buffer;
    headers: {
        [key: string]: string;
    };
}

export async function upload(event: UploadRequest) {
    const id = crypto.randomUUID();

    const params = {
        Bucket: Resource.BucketConverteAudiosInputTeste.name,
        Key: id,
        Body: event.body,
        ContentType: event.headers['content-type'] || 'application/octet-stream',
    };

    try {
        const command = new PutObjectCommand(params);
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

interface GetByIdRequest {
    pathParameters: {
        id: string
    }
}

export async function getById(event: GetByIdRequest) {
    const { id } = event.pathParameters;
    const command = new GetObjectCommand({
        Bucket: Resource.BucketConverteAudiosInputTeste.name,
        Key: id
    });

    return {
        statusCode: 302,
        headers: {
            Location: await getSignedUrl(s3, command),
        }
    }
}
