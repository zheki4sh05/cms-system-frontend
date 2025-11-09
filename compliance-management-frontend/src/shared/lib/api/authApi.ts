import { apiClient } from './apiClient';
import type { AuthResponse, LoginCredentials, RegisterCredentials } from '@shared/types/customTypes';

export class AuthApi {
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  }

  static async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  static async getCurrentUser(): Promise<AuthResponse['user']> {
    const response = await apiClient.get<AuthResponse['user']>('/auth/me');
    return response.data;
  }
   static async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  }
}
