import { API_URL } from './axios';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error('Invalid credentials');
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
};
  export const logoutUser = (): void => {
  localStorage.removeItem('access_token');
};
export const getToken = (): string | null => {
  return localStorage.getItem('access_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};
export const registerUser = async (email: string, password: string) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const msg = errorData.error?.message ?? errorData.message;
    throw new Error((Array.isArray(msg) ? msg.join(', ') : msg) || 'Registration failed');
  }

  const data = await res.json();
  if (data.access_token) {
    localStorage.setItem('access_token', data.access_token);
  }
  return data;
};

/** True while no admin account exists yet (or registration was explicitly reopened). */
export const getRegistrationStatus = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/auth/registration-status`);
    if (!res.ok) return false;
    return Boolean((await res.json()).open);
  } catch {
    return false;
  }
};
