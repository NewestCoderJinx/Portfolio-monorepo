import { BadRequestException } from '@nestjs/common';
import { existsSync } from 'fs';
import { mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { storeUploadedFile, uploadedFileUrl, uploadOptions } from './uploads';

describe('uploadOptions', () => {
  const opts = uploadOptions({ maxBytes: 1024, mimeTypes: /^application\/pdf$/, error: 'PDF only' });
  const filter = (mimetype: string) => {
    const cb = vi.fn();
    opts.fileFilter!({} as any, { mimetype } as any, cb);
    return cb.mock.calls[0];
  };

  it('accepts matching files and rejects others with the configured message', () => {
    expect(filter('application/pdf')).toEqual([null, true]);
    const [err, ok] = filter('image/png');
    expect(ok).toBe(false);
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.message).toBe('PDF only');
  });

  it('applies the size limit', () => {
    expect(opts.limits?.fileSize).toBe(1024);
  });
});

describe('uploadedFileUrl', () => {
  const req = { protocol: 'http', get: () => 'localhost:3000' } as any;

  it('builds a URL from the request host', () => {
    expect(uploadedFileUrl(req, { filename: 'a.pdf' } as any)).toBe('http://localhost:3000/uploads/a.pdf');
  });

  it('rejects a missing file', () => {
    expect(() => uploadedFileUrl(req, undefined)).toThrow(BadRequestException);
  });
});

describe('storeUploadedFile', () => {
  const req = { protocol: 'http', get: () => 'localhost:3000' } as any;
  const saved = process.env.CLOUDINARY_URL;
  afterEach(() => {
    if (saved === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = saved;
  });

  async function tempFile(name: string) {
    const path = join(await mkdtemp(join(tmpdir(), 'up-')), name);
    await writeFile(path, 'x');
    return { filename: name, path, mimetype: name.endsWith('.pdf') ? 'application/pdf' : 'image/webp' } as any;
  }

  it('keeps the file on disk without CLOUDINARY_URL', async () => {
    delete process.env.CLOUDINARY_URL;
    const file = await tempFile('1-2.webp');
    const upload = vi.fn();
    await expect(storeUploadedFile(req, file, 'image', upload)).resolves.toBe('http://localhost:3000/uploads/1-2.webp');
    expect(upload).not.toHaveBeenCalled();
    expect(existsSync(file.path)).toBe(true);
  });

  it('sends images and PDFs to Cloudinary and deletes the local copy', async () => {
    process.env.CLOUDINARY_URL = 'cloudinary://k:s@demo';
    const upload = vi.fn(async () => 'https://res.cloudinary.com/demo/x');

    const image = await tempFile('1-2.webp');
    await expect(storeUploadedFile(req, image, 'image', upload)).resolves.toBe('https://res.cloudinary.com/demo/x');
    expect(upload).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ resourceType: 'image', folder: 'portfolio/images', publicId: '1-2' }));
    expect(existsSync(image.path)).toBe(false);

    const pdf = await tempFile('3-4.pdf');
    await storeUploadedFile(req, pdf, 'document', upload);
    expect(upload).toHaveBeenLastCalledWith(expect.anything(), expect.objectContaining({ resourceType: 'raw', folder: 'portfolio/documents', publicId: '3-4.pdf' }));
  });

  it('turns a failed upload into a retryable error and still deletes the local copy', async () => {
    process.env.CLOUDINARY_URL = 'cloudinary://k:s@demo';
    const file = await tempFile('1-2.webp');
    const upload = vi.fn(async () => {
      throw new Error('Cloudinary upload failed (500)');
    });
    await expect(storeUploadedFile(req, file, 'image', upload)).rejects.toThrow('The file could not be stored');
    expect(existsSync(file.path)).toBe(false);
  });

  it('rejects a missing file', async () => {
    await expect(storeUploadedFile(req, undefined, 'image')).rejects.toThrow(BadRequestException);
  });
});
