import { getToken } from './auth';

const API_URL = 'http://localhost:3000';

export const getProjects = async () => {
  const res = await fetch(`${API_URL}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
};

export const createProject = async (projectData: any) => {
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