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

/**
 * Formats a Date to match the event ticket presentation format (e.g. "Nov 24,23 • 10.00 PM").
 *
 * @param date - Date object or ISO string of the event start time.
 * @returns string - Formatted date time string.
 */
export const formatEventDateTime = (date: Date | string): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getUTCMonth()];
  const day = d.getUTCDate();
  const yearShort = d.getUTCFullYear().toString().slice(-2);

  let hours = d.getUTCHours();
  const minutes = d.getUTCMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${month} ${day},${yearShort} • ${hours}.${minutes} ${ampm}`;
};

/**
 * Generates a clean, readable Ticket ID (e.g. "MOT3203920212") based on
 * the event organizer / event title initials and 10 random digits.
 *
 * @param organizerOrTitle - Event organizer name or event title.
 * @returns string - Unique ticket ID string.
 */
export const generateTicketId = (organizerOrTitle?: string): string => {
  let prefix = 'MOT';
  if (organizerOrTitle) {
    const words = organizerOrTitle.trim().split(/\s+/);
    if (words.length >= 3) {
      const first = words[0]?.[0] || 'M';
      const second = words[1]?.[0] || 'O';
      const third = words[2]?.[0] || 'T';
      prefix = (first + second + third).toUpperCase();
    } else {
      const letters = organizerOrTitle.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
      prefix = letters ? letters.padEnd(3, 'X') : 'MOT';
    }
  }

  const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return `${prefix}${randomDigits}`;
};

