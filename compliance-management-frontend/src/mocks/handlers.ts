
import { http, HttpResponse, delay } from 'msw';
import { mockUsers, generateMockTokens, getUserByToken } from './mockData';
import type { LoginCredentials, AuthResponse } from '@shared/types/customTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const handlers = [
  // ==================== AUTH HANDLERS ====================

  // POST /auth/login - Вход в систему
  http.post(`${API_BASE_URL}/auth/login`, async ({ request }) => {
    // Симуляция задержки сети
    await delay(500);

    const credentials = await request.json() as LoginCredentials;

    // Поиск пользователя
    const user = mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!user) {
      return HttpResponse.json(
        { 
          message: 'Неверный email или пароль',
          code: 'INVALID_CREDENTIALS'
        },
        { status: 401 }
      );
    }

    // Генерация токенов
    const tokens = generateMockTokens(user.id);

    // Возвращаем пользователя без пароля
    const { password, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      user: userWithoutPassword,
      tokens,
    };

    console.log('🔐 [MSW] Login successful:', userWithoutPassword.email);

    return HttpResponse.json(response, { status: 200 });
  }),

  // POST /auth/logout - Выход из системы
  http.post(`${API_BASE_URL}/auth/logout`, async () => {
    await delay(200);

    console.log('🔐 [MSW] Logout successful');

    return HttpResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );
  }),

  // POST /auth/refresh - Обновление токена
  http.post(`${API_BASE_URL}/auth/refresh`, async ({ request }) => {
    await delay(300);

    const body = await request.json() as { refreshToken: string };

    // Проверяем refresh token
    if (!body.refreshToken || !body.refreshToken.startsWith('mock_refresh_token_')) {
      return HttpResponse.json(
        { 
          message: 'Invalid refresh token',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }

    // Извлекаем userId из refresh token
    const parts = body.refreshToken.split('_');
    const userId = parts[3];

    // Генерируем новый access token
    const newAccessToken = `mock_access_token_${userId}_${Date.now()}`;

    console.log('🔐 [MSW] Token refreshed for user:', userId);

    return HttpResponse.json(
      { accessToken: newAccessToken },
      { status: 200 }
    );
  }),

  // GET /auth/me - Получение текущего пользователя
  http.get(`${API_BASE_URL}/auth/me`, async ({ request }) => {
    await delay(200);

    // Извлекаем токен из заголовка
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { 
          message: 'Unauthorized',
          code: 'MISSING_TOKEN'
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const user = getUserByToken(token);

    if (!user) {
      return HttpResponse.json(
        { 
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        },
        { status: 401 }
      );
    }

    console.log('🔐 [MSW] Get current user:', user.email);

    return HttpResponse.json(user, { status: 200 });
  }),
];