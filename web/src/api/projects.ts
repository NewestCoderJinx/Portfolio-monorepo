import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface Project {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export const getProjects = async (): Promise<Project[]> => {
  const response = await axios.get<Project[]>(`${API_BASE_URL}/projects`);
  return response.data;
};