import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import type { Request } from 'express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';

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
