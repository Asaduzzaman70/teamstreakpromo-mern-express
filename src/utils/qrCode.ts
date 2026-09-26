import QRCode from 'qrcode';
import type { QRCodeToBufferOptions, QRCodeToDataURLOptions } from 'qrcode';
import { uploadBufferToS3 } from './s3.js';
import { AppError } from './AppError.js';
import logger from './logger.js';

/**
 * Generates a PNG Buffer containing the QR code for the given data.
 *
 * @param data - The string or object payload to encode in the QR code.
 * @param options - Optional QRCode styling/configuration options.
 * @returns Promise<Buffer> - PNG image buffer of the QR code.
 */
export const generateQRCodeBuffer = async (
  data: string | Record<string, any>,
  options?: QRCodeToBufferOptions
): Promise<Buffer> => {
  try {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);

    const defaultOptions: QRCodeToBufferOptions = {
      errorCorrectionLevel: 'H',
      type: 'png',
      margin: 2,
      width: 400,
      ...options,
    };

    return await QRCode.toBuffer(payload, defaultOptions);
  } catch (error: any) {
    logger.error('[generateQRCodeBuffer] Error creating QR code buffer:', {
      error: error.message || error,
      data,
    });
    throw new AppError(`Failed to generate QR code buffer: ${error.message || error}`, 500);
  }
};

/**
 * Generates a QR Code as a PNG image, uploads it directly to AWS S3,
 * and returns the public S3 URL to be stored in the database.
 *
 * @param data - The string or object payload to encode in the QR code.
 * @param fileName - File name for the uploaded QR code image (defaults to 'ticket-qrcode.png').
 * @param folder - S3 folder prefix (defaults to 'qrcodes').
 * @returns Promise<string> - Public AWS S3 URL of the uploaded QR code.
 */
export const generateQRCode = async (
  data: string | Record<string, any>,
  fileName: string = 'ticket-qrcode.png',
  folder: string = 'qrcodes'
): Promise<string> => {
  try {
    const buffer = await generateQRCodeBuffer(data);
    const s3Url = await uploadBufferToS3(buffer, fileName, 'image/png', folder);
    logger.info(`[generateQRCode] Successfully generated and uploaded QR code to S3: ${s3Url}`);
    return s3Url;
  } catch (error: any) {
    logger.error('[generateQRCode] Error generating/uploading QR code to S3:', {
      error: error.message || error,
      fileName,
    });
    throw new AppError(`Failed to upload QR code to S3: ${error.message || error}`, 500);
  }
};

/**
 * Generates a base64 Data URL (PNG) QR code from a string or object.
 *
 * @param data - The string or object payload to encode in the QR code.
 * @param options - Optional QRCode styling/configuration options.
 * @returns Promise<string> - Base64 Data URL format (e.g. data:image/png;base64,...).
 */
export const generateQRCodeDataURL = async (
  data: string | Record<string, any>,
  options?: QRCodeToDataURLOptions
): Promise<string> => {
  try {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);

    const defaultOptions: QRCodeToDataURLOptions = {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 400,
      ...options,
    };

    return await QRCode.toDataURL(payload, defaultOptions);
  } catch (error: any) {
    logger.error('[generateQRCodeDataURL] Error generating QR code data URL:', {
      error: error.message || error,
      data,
    });
    throw new AppError(`Failed to generate QR code: ${error.message || error}`, 500);
  }
};
