import multer, { type FileFilterCallback, type Field } from 'multer';
import type { Request } from 'express';
import { AppError } from '../utils/AppError.js';

// Memory storage keeps uploaded files in RAM memory buffer (req.file.buffer / req.files[fieldName][0].buffer)
const storage = multer.memoryStorage();

const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WEBP, GIF) are allowed!', 400) as unknown as null, false);
  }
};

export const upload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size limit
  },
});

/**
 * Generic single file upload middleware helper.
 */
export const uploadSingle = (fieldName: string) => upload.single(fieldName);

/**
 * Generic multiple fields upload middleware helper.
 */
export const uploadFields = (fields: Field[]) => upload.fields(fields);

/**
 * Generic array of files upload middleware helper.
 */
export const uploadArray = (fieldName: string, maxCount: number = 10) =>
  upload.array(fieldName, maxCount);
