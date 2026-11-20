import { mkdtemp, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { describe, expect, it, vi } from 'vitest';
import { cloudinaryConfig, signParams, uploadToCloudinary } from './cloudinary';

const config = { cloudName: 'demo', apiKey: '1234', apiSecret: 'shh' };

describe('cloudinaryConfig', () => {
  it('is off when CLOUDINARY_URL is unset', () => {
    expect(cloudinaryConfig({})).toBeNull();
    expect(cloudinaryConfig({ CLOUDINARY_URL: ' ' })).toBeNull();
  });

  it('reads the key, secret and cloud name', () => {
    expect(cloudinaryConfig({ CLOUDINARY_URL: 'cloudinary://1234:s%2Fh@demo' })).toEqual({ cloudName: 'demo', apiKey: '1234', apiSecret: 's/h' });
  });

  it('rejects malformed values', () => {
    expect(() => cloudinaryConfig({ CLOUDINARY_URL: 'not a url' })).toThrow(/CLOUDINARY_URL/);
    expect(() => cloudinaryConfig({ CLOUDINARY_URL: 'https://1234:shh@demo' })).toThrow(/cloudinary:\/\//);
    expect(() => cloudinaryConfig({ CLOUDINARY_URL: 'cloudinary://1234@demo' })).toThrow(/cloudinary:\/\//);
  });
});

describe('signParams', () => {
  it("matches Cloudinary's documented example", () => {
    // From Cloudinary's "Generating authentication signatures" guide.
    expect(signParams({ timestamp: '1315060510', public_id: 'sample_image', eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop' }, 'abcd')).toBe(
      'bfd09f95f331f558cbd1320e67aa8d488770583e',
    );
  });
});

describe('uploadToCloudinary', () => {
  it('posts a signed upload and returns the https URL', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cld-'));
    const path = join(dir, 'a.webp');
    await writeFile(path, 'img');
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ secure_url: 'https://res.cloudinary.com/demo/a.webp' }), { status: 200 }));

    const url = await uploadToCloudinary(
      config,
      { path, resourceType: 'image', folder: 'portfolio/images', publicId: 'a', mimetype: 'image/webp' },
      fetchImpl as unknown as typeof fetch,
      () => 1_700_000_000_000,
    );

    expect(url).toBe('https://res.cloudinary.com/demo/a.webp');
    const [endpoint, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(endpoint).toBe('https://api.cloudinary.com/v1_1/demo/image/upload');
    const form = init.body as FormData;
    expect(form.get('api_key')).toBe('1234');
    expect(form.get('timestamp')).toBe('1700000000');
    expect(form.get('signature')).toBe(signParams({ folder: 'portfolio/images', public_id: 'a', timestamp: '1700000000' }, 'shh'));
    expect(form.get('file')).toBeInstanceOf(Blob);
  });

  it("reports Cloudinary's error message", async () => {
    const dir = await mkdtemp(join(tmpdir(), 'cld-'));
    const path = join(dir, 'a.pdf');
    await writeFile(path, 'pdf');
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { message: 'Invalid Signature' } }), { status: 401 }));

    await expect(
      uploadToCloudinary(config, { path, resourceType: 'raw', folder: 'f', publicId: 'a.pdf', mimetype: 'application/pdf' }, fetchImpl as unknown as typeof fetch),
    ).rejects.toThrow('Cloudinary upload failed (401): Invalid Signature');
  });
});
