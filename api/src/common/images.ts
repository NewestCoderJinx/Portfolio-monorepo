import { BadRequestException } from '@nestjs/common';
import { rename, unlink } from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import sharp from 'sharp';

/** Longest side after resizing; plenty for a full-width cover on a retina laptop. */
export const MAX_IMAGE_SIDE = 1920;
export const WEBP_QUALITY = 82;

/**
 * Re-encodes an uploaded image in place as WebP: applies EXIF rotation, strips metadata (e.g. GPS),
 * and shrinks it to fit MAX_IMAGE_SIDE. Also proves the file really is an image: one that can't be
 * decoded is deleted and rejected. GIFs are kept as uploaded so animations survive.
 * Mutates and returns the multer file so the caller's URL points at the new file.
 */
export async function optimizeUploadedImage(file: Express.Multer.File): Promise<Express.Multer.File> {
  try {
    const meta = await sharp(file.path).metadata();
    if (meta.format === 'gif') return file;

    const outName = `${basename(file.filename, extname(file.filename))}.webp`;
    const outPath = join(dirname(file.path), outName);
    const info = await sharp(file.path)
      .rotate()
      .resize({ width: MAX_IMAGE_SIDE, height: MAX_IMAGE_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outPath === file.path ? `${outPath}.tmp` : outPath);

    if (outPath === file.path) {
      // Uploaded as .webp: write beside it, then swap, so a failure never leaves a half-written file.
      await rename(`${outPath}.tmp`, outPath);
    } else {
      await unlink(file.path);
    }
    return Object.assign(file, { filename: outName, path: outPath, size: info.size, mimetype: 'image/webp' });
  } catch {
    await unlink(file.path).catch(() => undefined);
    throw new BadRequestException('That file could not be read as an image.');
  }
}
