import API from './axios';

export interface Project {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  githubUrl?: string;
  demoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  problem?: string;
  solution?: string;
  challenges?: string;
  decisions?: string;
  lessonsLearned?: string;
  featured?: boolean;
  /** false = draft, only visible in Admin. */
  published?: boolean;
  /** Extra screenshot URLs shown in the case study. */
  gallery?: string[] | null;
  sortOrder?: number;
  /** Case-study opens; only returned to Admin. */
  views?: number;
  /** Admin only: visits by people through /p/<id> share links. */
  shareClicks?: number;
}

export const formatUrl = (url?: string): string | undefined => {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const getProjects = async (): Promise<Project[]> => {
  const res = await API.get<Project[]>('/projects');
  return res.data;
};

/** Every project including drafts; requires login. */
export const getAllProjects = async (): Promise<Project[]> => {
  const res = await API.get<Project[]>('/projects/manage');
  return res.data;
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
  const res = await API.post<Project>('/projects', projectData);
  return res.data;
};

/** null clears a field; omitted fields are left unchanged. */
export type ProjectUpdate = { [K in keyof Omit<Project, 'id'>]?: Project[K] | null };

export const updateProject = async (id: string, projectData: ProjectUpdate): Promise<Project> => {
  const res = await API.patch<Project>(`/projects/${id}`, projectData);
  return res.data;
};

/** Saves the display order; ids must be in the desired order. */
export const reorderProjects = async (ids: string[]): Promise<Project[]> => {
  const res = await API.patch<Project[]>('/projects/reorder', { ids });
  return res.data;
};

/**
 * Counts a case-study view. Fire-and-forget: a failure never affects the visitor.
 * Skipped when logged in, so the owner's own previews don't inflate the count.
 */
export const recordProjectView = (id: string): void => {
  if (localStorage.getItem('access_token')) return;
  API.post(`/projects/${id}/view`).catch(() => {});
};

export const deleteProject = async (id: string): Promise<void> => {
  await API.delete(`/projects/${id}`);
};

export const uploadProjectImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await API.post<{ imageUrl: string }>('/projects/upload', formData);
  return res.data.imageUrl;
};

export interface StatSeries {
  views: number[];
  shareClicks: number[];
}

/** Daily counts, every array aligned with `days` (YYYY-MM-DD, UTC, oldest first). */
export interface ProjectStats {
  days: string[];
  totals: StatSeries;
  /** Keyed by project id; only projects with activity in the window. */
  projects: Record<string, StatSeries>;
}

/** Admin only: daily views and share visits for the last `days` days. */
export const getProjectStats = async (days = 30): Promise<ProjectStats> => {
  const res = await API.get<ProjectStats>('/projects/stats', { params: { days } });
  return res.data;
};
