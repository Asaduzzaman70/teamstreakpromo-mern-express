import { PutObjectCommand, type ObjectCannedACL } from '@aws-sdk/client-s3';
import { s3Client } from '../config/s3.config.js';
import config from '../config/config.js';
import { AppError } from './AppError.js';

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder: string = 'uploads',
  isPublic: boolean = true
): Promise<string> => {
  if (!file || !file.buffer) {
    throw new AppError('File buffer is empty or invalid for S3 upload', 400);
  }

  const sanitizedFileName = file.originalname.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
  const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: config.awsS3BucketName,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ...(isPublic ? { ACL: 'public-read' as ObjectCannedACL } : {}),
  });

  try {
    await s3Client.send(command);
    return `https://${config.awsS3BucketName}.s3.${config.awsRegion}.amazonaws.com/${key}`;
  } catch (error: any) {
    throw new AppError(`Failed to upload image to S3: ${error.message || error}`, 500);
  }
};

export const uploadBufferToS3 = async (
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = 'uploads',
  isPublic: boolean = true
): Promise<string> => {
  const sanitizedFileName = originalName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
  const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: config.awsS3BucketName,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ...(isPublic ? { ACL: 'public-read' as ObjectCannedACL } : {}),
  });

  try {
    await s3Client.send(command);
    return `https://${config.awsS3BucketName}.s3.${config.awsRegion}.amazonaws.com/${key}`;
  } catch (error: any) {
    throw new AppError(`Failed to upload image to S3: ${error.message || error}`, 500);
  }
};
