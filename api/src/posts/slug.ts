import { SLUG_MAX } from './dto/create-post.dto';

/** "Hello, Wörld!" -> "hello-world". Falls back to "post" when nothing usable is left. */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, SLUG_MAX)
    .replace(/^-+|-+$/g, '');
  return slug || 'post';
}
