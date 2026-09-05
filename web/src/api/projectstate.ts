import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export type Project = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export interface CreateProjectPayload {
  title: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateProjectPayload {
  title?: string;
  description?: string;
  imageUrl?: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const response = await axios.get<Project[]>(`${API_BASE_URL}/projects`);
  return response.data;
};

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const response = await axios.post<Project>(`${API_BASE_URL}/projects`, payload);
  return response.data;
};

export const updateProject = async (id: string, payload: UpdateProjectPayload): Promise<Project> => {
  const response = await axios.patch<Project>(`${API_BASE_URL}/projects/${id}`, payload);
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/projects/${id}`);
};