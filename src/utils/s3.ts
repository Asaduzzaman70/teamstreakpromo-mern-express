import { PutObjectCommand, DeleteObjectCommand, type ObjectCannedACL } from '@aws-sdk/client-s3';
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

export const deleteFromS3 = async (fileUrl: string): Promise<void> => {
  if (!fileUrl) return;
  try {
    let key = fileUrl;
    if (fileUrl.includes('.amazonaws.com/')) {
      const parts = fileUrl.split('.amazonaws.com/');
      if (parts[1]) {
        key = parts[1];
      }
    } else if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const parsed = new URL(fileUrl);
      key = parsed.pathname.substring(1);
    }

    if (!key) return;

    const command = new DeleteObjectCommand({
      Bucket: config.awsS3BucketName,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error: any) {
    console.error(`Failed to delete file from S3 (${fileUrl}):`, error.message || error);
  }
};


