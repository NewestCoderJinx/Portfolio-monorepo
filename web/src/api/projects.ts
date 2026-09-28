import API from './axios';

export interface Project {
  id?: string;
  title: string;
  description: string;
  tags?: string;
  imageUrl?: string;
  githubUrl?: string;
  demoUrl?: string;
  createdAt?: string;
}

export const fetchProjects = async (): Promise<Project[]> => {
  const response = await API.get<Project[]>('/projects');
  return response.data;
};

export const createProject = async (projectData: Project): Promise<Project> => {
  const response = await API.post<Project>('/projects', projectData);
  return response.data;
};