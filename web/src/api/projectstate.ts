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

export const deleteProject = async (id: string): Promise<void> => {
  await API.delete(`/projects/${id}`);
};

export const uploadProjectImage = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await API.post<{ imageUrl: string }>('/projects/upload', formData);
  return res.data.imageUrl;
};
