import API from './axios';

export interface Project {
  id: number;
  title: string;
  description: string;
  link?: string;
}

export const fetchProjects = async (): Promise<Project[]> => {
  const response = await API.get<Project[]>('/projects');
  return response.data;
};

export const createProject = async (projectData: Partial<Project>): Promise<Project> => {
  const response = await API.post<Project>('/projects', projectData);
  return response.data;
};