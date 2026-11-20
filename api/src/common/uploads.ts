import { BadGatewayException, BadRequestException, Logger } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Request } from 'express';
import { mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { basename, extname } from 'path';
import { cloudinaryConfig, uploadToCloudinary } from './cloudinary';

export const UPLOAD_DIR = './uploads';

/** Multer settings for a disk upload limited by size and MIME type. */
export function uploadOptions(opts: { maxBytes: number; mimeTypes: RegExp; error: string }): MulterOptions {
  return {
    storage: diskStorage({
      destination: (_req, _file, callback) => {
        mkdirSync(UPLOAD_DIR, { recursive: true });
        callback(null, UPLOAD_DIR);
      },
      filename: (_req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        callback(null, `${uniqueSuffix}${extname(file.originalname).toLowerCase()}`);
      },
    }),
    limits: { fileSize: opts.maxBytes },
    fileFilter: (_req, file, callback) => {
      if (!opts.mimeTypes.test(file.mimetype)) {
        return callback(new BadRequestException(opts.error), false);
      }
      callback(null, true);
    },
  };
}

/** Public URL for a stored upload. */
export function uploadedFileUrl(req: Request, file: Express.Multer.File | undefined): string {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  const baseUrl = process.env.PUBLIC_API_URL || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${file.filename}`;
}

const logger = new Logger('Uploads');

/**
 * Stores an uploaded file and returns its public URL. With CLOUDINARY_URL set the file goes to
 * Cloudinary and the local copy is deleted (for hosts whose disk doesn't survive a restart);
 * otherwise it stays in UPLOAD_DIR and the API serves it under /uploads/.
 */
export async function storeUploadedFile(
  req: Request,
  file: Express.Multer.File | undefined,
  kind: 'image' | 'document',
  upload: typeof uploadToCloudinary = uploadToCloudinary,
): Promise<string> {
  if (!file) {
    throw new BadRequestException('No file uploaded');
  }
  const config = cloudinaryConfig();
  if (!config) return uploadedFileUrl(req, file);

  try {
    return await upload(config, {
      path: file.path,
      // PDFs go up as "raw" so they're served unchanged, and keep their extension so browsers open them.
      resourceType: kind === 'image' ? 'image' : 'raw',
      folder: kind === 'image' ? 'portfolio/images' : 'portfolio/documents',
      publicId: kind === 'image' ? basename(file.filename, extname(file.filename)) : file.filename,
      mimetype: file.mimetype,
    });
  } catch (err) {
    logger.error(err instanceof Error ? err.message : String(err));
    throw new BadGatewayException('The file could not be stored. Please try again.');
  } finally {
    await unlink(file.path).catch(() => undefined);
  }
}
