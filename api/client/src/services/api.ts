const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface Profile {
  id: string;
  name: string;
  headline: string;
  bio: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  challenges: string;
  decisions: string;
  lessonsLearned: string;
  tags: string[];
  githubUrl: string;
  demoUrl: string;
}

export async function fetchProfile(): Promise<Profile> {
  const res = await fetch(`${API_BASE_URL}/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE_URL}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}