import API, { API_URL } from './axios';

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

/** Fired on window when the API rejects the saved login (expired or revoked). */
export const SESSION_EXPIRED_EVENT = 'auth:expired';

/** When the token expires, in ms since the epoch; null if it can't be read. */
export const tokenExpiry = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

/** The saved token, or null if there is none or it has expired (an expired one is cleared). */
export const getToken = (): string | null => {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  const expiry = tokenExpiry(token);
  if (expiry !== null && expiry <= Date.now()) {
    logoutUser();
    return null;
  }
  return token;
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

export interface Account {
  email: string;
  createdAt: string;
  passwordChangedAt: string | null;
}

export const getAccount = async (): Promise<Account> => {
  const res = await API.get<Account>('/auth/me');
  return res.data;
};

/** Changes the password and keeps this session going with the fresh token; other devices are signed out. */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const res = await API.patch<{ access_token: string }>('/auth/password', { currentPassword, newPassword });
  localStorage.setItem('access_token', res.data.access_token);
};
