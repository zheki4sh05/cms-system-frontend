    
import type { User, UserRole, AuthTokens } from '@shared/types/customTypes';
import { UserRoleValues } from '@shared/types/customTypes';
// Моковые пользователи для тестирования
export const mockUsers: Array<User & { password: string }> = [
  {
    id: '1',
    email: 'manager@example.com',
    password: 'password123',
    firstName: 'Иван',
    lastName: 'Менеджеров',
    role: UserRoleValues.MANAGER,
    companyId: 'company-1',
    departmentId: 'dept-001',
    isFirstLogin: false
  },
  {
    id: '2',
    email: 'supervisor@example.com',
    password: 'password123',
    firstName: 'Петр',
    lastName: 'Руководителев',
    role: UserRoleValues.SUPERVISOR,
    companyId: 'company-1',
    departmentId: 'dept-001',
  },
  {
    id: '3',
    email: 'executive@example.com',
    password: 'password123',
    firstName: 'Анна',
    lastName: 'Директорова',
    role: UserRoleValues.EXECUTIVE,
    companyId: 'company-1',
    departmentId: undefined,
  },
];

// Генерация моковых токенов
export const generateMockTokens = (userId: string): AuthTokens => {
  const accessToken = `mock_access_token_${userId}_${Date.now()}`;
  const refreshToken = `mock_refresh_token_${userId}_${Date.now()}`;

  return {
    accessToken,
    refreshToken,
  };
};

// Проверка валидности мокового токена
export const validateMockToken = (token: string): { valid: boolean; userId?: string } => {
  if (!token || !token.startsWith('mock_access_token_')) {
    return { valid: false };
  }

  // Извлекаем userId из токена
  const parts = token.split('_');
  if (parts.length < 4) {
    return { valid: false };
  }

  const userId = parts[3];
  return { valid: true, userId };
};

// Получение пользователя по токену
export const getUserByToken = (token: string): User | null => {
  const validation = validateMockToken(token);

  if (!validation.valid || !validation.userId) {
    return null;
  }

  const user = mockUsers.find(u => u.id === validation.userId);

  if (!user) {
    return null;
  }

  // Возвращаем пользователя без пароля
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};