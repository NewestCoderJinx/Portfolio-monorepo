import axios from 'axios';
import { getToken } from './auth';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Project {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  githubUrl?: string;
  demoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  imageUrl?: string;
  tags?: string[];
  githubUrl?: string;
  demoUrl?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const response = await api.get<Project[]>('/projects');
  return response.data;
};

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const response = await api.post<Project>('/projects', payload);
  return response.data;
};

export const updateProject = async (id: string, payload: Partial<CreateProjectPayload>): Promise<Project> => {
  const response = await api.patch<Project>(`/projects/${id}`, payload);
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`);
};