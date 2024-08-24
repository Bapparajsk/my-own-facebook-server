import s3 from '../config/s3.config';
import { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import axios from 'axios';

export const getObjectURL = async (key: string) : Promise<string> => {
    const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET!,
        Key: key,
    });

    return await getSignedUrl(s3, command, { expiresIn: 24 * 60 * 60 });  // 1 day after expire this url
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

export const uploadImageToS3 = async (url: string, name: string) => {
    
    const response = await axios.get(url, { responseType: 'arraybuffer' });  // get image from url
    const file = await sharp(response.data)  // resize image
    .resize(300, 300)
    .toBuffer();

    // create file name and content type
    const fileName = `${name}-${Date.now()}.png`;
    const contentType = 'image/png';

    // upload image to s3
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET!,
        Key: fileName,
        Body: file,
        ContentType: contentType
    });

    try {
        await s3.send(command);
        console.log(`Successfully uploaded object with key ${fileName}`);

        return fileName;
    } catch (error) {
        console.error(`Failed to upload object with key ${fileName}`, error);
        throw new Error(`Failed to upload object with key ${fileName}`);
    }
};