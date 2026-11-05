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

export type ProfileUpdate = Partial<{ [K in keyof Omit<Profile, 'id'>]: Profile[K] | null }>;

export const updateProfile = async (data: ProfileUpdate): Promise<Profile> => {
  const res = await API.patch<Profile>('/profile', data);
  return res.data;
};

/** Pulls readable validation messages out of an API error response. */
export const apiErrorMessage = (err: unknown, fallback: string): string => {
  if (isAxiosError(err)) {
    const msg = err.response?.data?.error?.message ?? err.response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  return fallback;
};
