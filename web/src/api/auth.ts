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
    if (res.status === 429) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error?.message ?? errorData.message ?? 'Too many failed sign-in attempts. Please try again later.');
    }
    throw new Error('Invalid credentials');
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  return data;
};
/** Forgets the saved login in this browser only. */
export const logoutUser = (): void => {
  localStorage.removeItem('access_token');
};

/** Ends this session on the server too, so the token stops working even if it was copied. */
export const signOut = async (): Promise<void> => {
  const token = localStorage.getItem('access_token');
  logoutUser();
  if (!token) return;
  await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => undefined);
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

/** Changes the password; this session continues and every other one is signed out. */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  await API.patch('/auth/password', { currentPassword, newPassword });
};

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  lastSeenAt: string;
  /** The session this browser is using. */
  current: boolean;
}

export const getSessions = async (): Promise<SessionInfo[]> => (await API.get<SessionInfo[]>('/auth/sessions')).data;

export const revokeSession = async (id: string): Promise<void> => {
  await API.delete(`/auth/sessions/${id}`);
};

/** Signs out every session but this one; returns how many were ended. */
export const revokeOtherSessions = async (): Promise<number> => (await API.delete<{ signedOut: number }>('/auth/sessions')).data.signedOut;

/** "Firefox on Linux" from a User-Agent header; good enough to tell your own devices apart. */
export const describeUserAgent = (ua: string | null): string => {
  if (!ua) return 'Unknown device';
  const browser =
    /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) ? 'Safari'
    : /curl|PostmanRuntime|axios|node/i.test(ua) ? 'API client'
    : 'Browser';
  const os =
    /iPhone|iPad|iPod/.test(ua) ? 'iOS'
    : /Android/.test(ua) ? 'Android'
    : /Windows/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Linux/.test(ua) ? 'Linux'
    : null;
  return os ? `${browser} on ${os}` : browser;
};
