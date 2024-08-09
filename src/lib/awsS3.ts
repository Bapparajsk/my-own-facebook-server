import s3 from '../config/s3.config';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const getObjectURL = async (key: string) : Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET!,
        Key: key,
    });

    return await getSignedUrl(s3, command);
}

export const putObjectURL = async (fileName: string, contentType: string): Promise<string>  => {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET!,
        Key: fileName,
        ContentType: contentType
    });

    return await getSignedUrl(s3, command, { expiresIn: 10 * 60 });  // 3 minutes after expire this url
}

export const deleteObject = async (key: string) : Promise<void> => {

    const Bucket = process.env.AWS_BUCKET;

    if (Bucket === undefined) {
        throw new Error("Bucket is not defined in .env file");
    }

    const command = new DeleteObjectCommand({
        Bucket: Bucket,
        Key: key
    });

    try {
        await s3.send(command);
        console.log(`Successfully deleted object with key ${key}`);
    } catch (error) {
        console.error(`Failed to delete object with key ${key}`, error);
        throw new Error(`Failed to delete object with key ${key}`);
    }
}