import s3 from '../config/s3.config';
import {GetObjectCommand, PutObjectCommand} from '@aws-sdk/client-s3';
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

    return await getSignedUrl(s3, command, { expiresIn: 3 * 60 });  // 3 minutes after expire this url
}
