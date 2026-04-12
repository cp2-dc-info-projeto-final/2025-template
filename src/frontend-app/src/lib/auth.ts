import api from './api';
import type { ApiResponse } from './api';
import type { User } from './models/User';

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface Session {
  token: string;
}

export type LoginResponse = ApiResponse<Session>;

export type { User };

// Funções para obter, criar ou limpar o token de autenticação
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('auth_token');
  }
  return null;
}

export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('auth_token', token);
  }
}

export function removeToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('auth_token');
  }
}

// Função de login, obtendo token do backend
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  try {
    const response = await api.post('/users/login', credentials);

    const body = response.data as LoginResponse;

    if (body.success && body.data?.token) {
      setToken(body.data.token);
      return body;
    }

    if (body.success) {
      return {
        success: false,
        message: 'Token não retornado na autenticação',
        errors: []
      };
    }

    return body;
  } catch (error) {
    console.error('Erro no login:', error);
    const body = (error as any)?.response?.data as LoginResponse | undefined;
    if (body) {
      return body;
    }
    return { success: false, message: 'Credenciais inválidas', errors: [] };
  }
}

export async function logout(): Promise<void> {
  try {
    const token = getToken();
    if (token) {
      await api.post('/users/logout');
    }
  } catch (error) {
    console.error('Erro no logout:', error);
  } finally {
    removeToken();
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

    const response = await api.get('/users/me');
    const body = response.data as ApiResponse<User>;

    if (body.success) {
      return body.data ?? null;
    }

    removeToken();
    return null;
  } catch (error) {
    console.error('Erro ao carregar usuário:', error);
    removeToken();
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}
