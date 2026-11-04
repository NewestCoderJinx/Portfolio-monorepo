import { isAxiosError } from 'axios';
import API from './axios';

export interface Profile {
  id: string;
  name: string;
  headline?: string;
  bio?: string;
  location?: string;
  email?: string;
  avatarUrl?: string;
  websiteUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

/** Returns the developer profile, or null if none has been created yet. */
export const getProfile = async (): Promise<Profile | null> => {
  try {
    const res = await API.get<Profile>('/profile');
    return res.data;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 404) return null;
    throw err;
  }
};
