import { Resource } from "sst"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda";

const s3 = new S3Client({});

export const uploadUrl: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async () => {
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

export const upload: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
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

export const getById: Handler<APIGatewayProxyEvent, APIGatewayProxyResult> = async (event) => {
    const { id } = event.pathParameters;
    const command = new GetObjectCommand({
        Bucket: Resource.BucketConverteAudiosInputTeste.name,
        Key: id
    });

    return {
        statusCode: 302,
        headers: {
            Location: await getSignedUrl(s3, command),
        },
        body: ""
    }
}
