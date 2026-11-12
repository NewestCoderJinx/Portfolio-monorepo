import API from './axios';

export interface Post {
  id: string;
  title: string;
  /** URL part of /blog/<slug>. */
  slug: string;
  excerpt: string | null;
  /** Markdown. Left out of the public post list. */
  body: string;
  coverImageUrl: string | null;
  tags: string[] | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PostSummary = Omit<Post, 'body'>;

export interface PostInput {
  title: string;
  /** Left out to generate one from the title. */
  slug?: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  tags: string[] | null;
  published: boolean;
}

/** Published posts, newest first. */
export const getPosts = async (): Promise<PostSummary[]> => (await API.get<PostSummary[]>('/posts')).data;

/** A published post; 404s for drafts. */
export const getPost = async (slug: string): Promise<Post> => (await API.get<Post>(`/posts/${encodeURIComponent(slug)}`)).data;

/** Every post, drafts included (Admin). */
export const getAllPosts = async (): Promise<Post[]> => (await API.get<Post[]>('/posts/manage')).data;

export const createPost = async (data: PostInput): Promise<Post> => (await API.post<Post>('/posts', data)).data;

export const updatePost = async (id: string, data: Partial<PostInput>): Promise<Post> => (await API.patch<Post>(`/posts/${id}`, data)).data;

export const deletePost = async (id: string): Promise<void> => {
  await API.delete(`/posts/${id}`);
};

/** Mirrors the API's slug rules, for the hint under the link field. */
export const slugify = (text: string): string =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 80)
    .replace(/^-+|-+$/g, '') || 'post';

/** "5 min read", at ~220 words a minute. */
export const readingTime = (markdown: string): string => {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
};

export const formatPostDate = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';
