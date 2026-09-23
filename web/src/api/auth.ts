import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface AuthResponse {
  access_token: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

export const setToken = (token: string): void => {
  localStorage.setItem('admin_token', token);
};

export const getToken = (): string | null => {
  return localStorage.getItem('admin_token');
};

export const removeToken = (): void => {
  localStorage.removeItem('admin_token');
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};