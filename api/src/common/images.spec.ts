import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_IMAGE_SIDE, optimizeUploadedImage } from './images';

describe('optimizeUploadedImage', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'img-'));
  });

  const upload = async (name: string, data: Buffer) => {
    const path = join(dir, name);
    writeFileSync(path, data);
    return { filename: name, path, size: data.length, mimetype: 'image/jpeg' } as Express.Multer.File;
  };

  const solid = (width: number, height: number) => sharp({ create: { width, height, channels: 3, background: '#2c56ad' } });

  it('converts to WebP, shrinks large images and removes the original', async () => {
    const file = await upload('big.jpg', await solid(4000, 2000).jpeg().toBuffer());
    const out = await optimizeUploadedImage(file);
    expect(out.filename).toBe('big.webp');
    expect(out.mimetype).toBe('image/webp');
    expect(existsSync(join(dir, 'big.jpg'))).toBe(false);
    const meta = await sharp(out.path).metadata();
    expect(meta.format).toBe('webp');
    expect([meta.width, meta.height]).toEqual([MAX_IMAGE_SIDE, MAX_IMAGE_SIDE / 2]);
  });

  it('never enlarges small images', async () => {
    const out = await optimizeUploadedImage(await upload('small.png', await solid(300, 200).png().toBuffer()));
    const meta = await sharp(out.path).metadata();
    expect([meta.width, meta.height]).toEqual([300, 200]);
  });

  it('applies EXIF rotation and strips metadata', async () => {
    const rotated = await solid(400, 200).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    const out = await optimizeUploadedImage(await upload('phone.jpg', rotated));
    const meta = await sharp(out.path).metadata();
    expect([meta.width, meta.height]).toEqual([200, 400]);
    expect(meta.orientation).toBeUndefined();
    expect(meta.exif).toBeUndefined();
  });

  it('re-encodes an uploaded WebP in place', async () => {
    const out = await optimizeUploadedImage(await upload('a.webp', await solid(2500, 2500).webp().toBuffer()));
    expect(out.filename).toBe('a.webp');
    expect((await sharp(out.path).metadata()).width).toBe(MAX_IMAGE_SIDE);
    expect(existsSync(`${out.path}.tmp`)).toBe(false);
  });

  it('keeps GIFs as uploaded', async () => {
    const gif = await upload('anim.gif', await solid(50, 50).gif().toBuffer());
    const out = await optimizeUploadedImage(gif);
    expect(out.filename).toBe('anim.gif');
    expect(existsSync(out.path)).toBe(true);
  });

  it('rejects and deletes files that are not images', async () => {
    const fake = await upload('evil.png', Buffer.from('<?php echo "hi"; ?>'));
    await expect(optimizeUploadedImage(fake)).rejects.toBeInstanceOf(BadRequestException);
    expect(existsSync(fake.path)).toBe(false);
  });
});
