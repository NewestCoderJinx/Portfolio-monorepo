import { createHash } from 'crypto';
import { readFile } from 'fs/promises';

/**
 * Optional file storage on Cloudinary, for hosts whose disk is wiped on every restart (e.g. Render's
 * free plan). Turned on by CLOUDINARY_URL, which Cloudinary's dashboard shows as
 * cloudinary://<api key>:<api secret>@<cloud name>. Uses the plain upload API, so no SDK is needed.
 */
export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

/** Reads CLOUDINARY_URL. Returns null when it's unset; throws when it's set but malformed. */
export function cloudinaryConfig(env: NodeJS.ProcessEnv = process.env): CloudinaryConfig | null {
  const raw = env.CLOUDINARY_URL?.trim();
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('CLOUDINARY_URL is not a valid URL; expected cloudinary://<api key>:<api secret>@<cloud name>.');
  }
  const config = {
    cloudName: url.hostname,
    apiKey: decodeURIComponent(url.username),
    apiSecret: decodeURIComponent(url.password),
  };
  if (url.protocol !== 'cloudinary:' || !config.cloudName || !config.apiKey || !config.apiSecret) {
    throw new Error('CLOUDINARY_URL must look like cloudinary://<api key>:<api secret>@<cloud name>.');
  }
  return config;
}

/** Cloudinary's request signature: the sorted parameters as a query string plus the secret, SHA-1 hashed. */
export function signParams(params: Record<string, string>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}

export interface CloudinaryUpload {
  /** Local file to send. */
  path: string;
  /** "image" for pictures; "raw" for anything served as-is, such as PDFs. */
  resourceType: 'image' | 'raw';
  folder: string;
  publicId: string;
  mimetype: string;
}

/** Uploads one file and returns its https URL. */
export async function uploadToCloudinary(
  config: CloudinaryConfig,
  upload: CloudinaryUpload,
  fetchImpl: typeof fetch = fetch,
  now: () => number = Date.now,
): Promise<string> {
  const params = { folder: upload.folder, public_id: upload.publicId, timestamp: String(Math.floor(now() / 1000)) };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append('api_key', config.apiKey);
  form.append('signature', signParams(params, config.apiSecret));
  form.append('file', new Blob([await readFile(upload.path)], { type: upload.mimetype }), upload.publicId);

  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${upload.resourceType}/upload`;
  const res = await fetchImpl(endpoint, { method: 'POST', body: form, signal: AbortSignal.timeout(60_000) });
  const body = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !body.secure_url) {
    throw new Error(`Cloudinary upload failed (${res.status}): ${body.error?.message ?? 'no URL in the response'}`);
  }
  return body.secure_url;
}
