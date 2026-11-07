import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { uploadedFileUrl, uploadOptions } from './uploads';

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
