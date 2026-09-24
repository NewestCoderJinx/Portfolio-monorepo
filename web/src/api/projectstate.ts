import { getToken } from './auth';

const API_URL = 'http://localhost:3000';

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
}

export const getProjects = async (): Promise<Project[]> => {
  const res = await fetch(`${API_URL}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
};
export const formatUrl = (url?: string): string | undefined => {
  if (!url || !url.trim()) return undefined;
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
};

export const updateProject = async (id: string, projectData: Partial<Project>): Promise<Project> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });
  if (!res.ok) throw new Error('Failed to update project');
  return res.json();
};

export const deleteProject = async (id: string): Promise<void> => {
  const token = getToken();
  const res = await fetch(`${API_URL}/projects/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to delete project');
};