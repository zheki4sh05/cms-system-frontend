
import { http, HttpResponse, delay } from 'msw';
import { mockUsers, generateMockTokens, getUserByToken } from './mockData';
import { type LoginCredentials, type AuthResponse, UserRoleValues } from '@shared/types/customTypes';
import type {User} from '../shared/types/customTypes'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Хранилище приглашений
const mockInvitations: any[] = [];

// Хранилище департаментов
const mockDepartments: any[] = [
  {
    id: 'dept-001',
    name: 'Отдел закупок №1',
    description: 'Основной отдел закупок',
    managerId: '2',
    managerName: 'Петр Руководителев',
    employeeCount: 5,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2025-11-01T00:00:00Z',
  },
  {
    id: 'dept-002',
    name: 'Отдел закупок №2',
    description: 'Дополнительный отдел закупок',
    employeeCount: 3,
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2025-10-15T00:00:00Z',
  },
  {
    id: 'dept-003',
    name: 'Департамент стратегических закупок',
    description: 'Работа с крупными поставщиками',
    managerId: '2',
    managerName: 'Петр Руководителев',
    employeeCount: 8,
    createdAt: '2024-06-10T00:00:00Z',
    updatedAt: '2025-11-05T00:00:00Z',
  },
];


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

  // POST /auth/register - Регистрация
http.post(`${API_BASE_URL}/auth/register`, async ({ request }) => {
  await delay(700);
  const body = await request.json() as {email: string, password: string, firstName: string, lastName: string, role: string, departmentId: string};
  const existing = mockUsers.find(u => u.email === body.email);
  if (existing) {
    return HttpResponse.json(
      { message: 'Пользователь с таким email уже существует', code: 'DUPLICATE_EMAIL' },
      { status: 409 }
    );
  }
  const id = (Math.max(...mockUsers.map(u => +u.id || 0), 0) + 1).toString();
  // Имплементация isFirstLogin=true!
  const user: User & { password: string }  = {
    id,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    role:'EXECUTIVE',
    departmentId: body.departmentId,
    isFirstLogin: true,
    password: body.password,
  };
  mockUsers.push(user);
  const tokens = generateMockTokens(id);
  const {...userWithoutPassword } = user;
  const response = {
    user: userWithoutPassword,
    tokens,
  };
  return HttpResponse.json(response, { status: 201 });
}),

// POST /invitations/send - Отправка приглашения
http.post(`${API_BASE_URL}/invitations/send`, async ({ request }) => {
  await delay(800);

  const body: any = await request.json();

  // Валидация
  if (!body.email || !body.role) {
    return HttpResponse.json(
      { message: 'Email и роль обязательны' },
      { status: 400 }
    );
  }

  // Проверка существующего пользователя
  const existingUser = mockUsers.find(u => u.email === body.email);
  if (existingUser) {
    return HttpResponse.json(
      { message: 'Пользователь с таким email уже существует в системе' },
      { status: 409 }
    );
  }

  // Проверка существующего приглашения
  const existingInvitation = mockInvitations.find(
    inv => inv.email === body.email && inv.status === 'PENDING'
  );
  if (existingInvitation) {
    return HttpResponse.json(
      { message: 'На этот email уже отправлено активное приглашение' },
      { status: 409 }
    );
  }

  // Создание приглашения
  const invitation = {
    id: `inv-${Date.now()}`,
    email: body.email,
    role: body.role,
    departmentId: body.departmentId,
    invitedBy: body.invitedBy,
    invitedByName: 'Текущий пользователь',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 дней
  };

  mockInvitations.push(invitation);

  return HttpResponse.json({
    invitation,
    message: 'Приглашение успешно отправлено',
  }, { status: 201 });
}),

// GET /invitations/sent - Получение отправленных приглашений
http.get(`${API_BASE_URL}/invitations/sent`, async () => {
  await delay(300);
  return HttpResponse.json(mockInvitations);
}),

// GET /invitations/received/:email - Получение приглашений для email
http.get(`${API_BASE_URL}/invitations/received/:email`, async ({ params }) => {
  await delay(300);
  const { email } = params;
  const userInvitations = mockInvitations.filter(
    inv => inv.email === email && inv.status === 'PENDING'
  );
  return HttpResponse.json(userInvitations);
}),

// POST /invitations/:id/accept - Принятие приглашения
http.post(`${API_BASE_URL}/invitations/:id/accept`, async ({ params }) => {
  await delay(500);
  const { id } = params;
  const invitation = mockInvitations.find(inv => inv.id === id);

  if (!invitation) {
    return HttpResponse.json(
      { message: 'Приглашение не найдено' },
      { status: 404 }
    );
  }

  if (invitation.status !== 'PENDING') {
    return HttpResponse.json(
      { message: 'Приглашение уже обработано' },
      { status: 400 }
    );
  }

  invitation.status = 'ACCEPTED';

  return HttpResponse.json({
    message: 'Приглашение принято',
  });
}),

// POST /invitations/:id/reject - Отклонение приглашения
http.post(`${API_BASE_URL}/invitations/:id/reject`, async ({ params }) => {
  await delay(500);
  const { id } = params;
  const invitation = mockInvitations.find(inv => inv.id === id);

  if (!invitation) {
    return HttpResponse.json(
      { message: 'Приглашение не найдено' },
      { status: 404 }
    );
  }

  if (invitation.status !== 'PENDING') {
    return HttpResponse.json(
      { message: 'Приглашение уже обработано' },
      { status: 400 }
    );
  }

  invitation.status = 'REJECTED';

  return HttpResponse.json({
    message: 'Приглашение отклонено',
  });
}),

// DELETE /invitations/:id - Отмена приглашения
http.delete(`${API_BASE_URL}/invitations/:id`, async ({ params }) => {
  await delay(500);
  const { id } = params;
  const index = mockInvitations.findIndex(inv => inv.id === id);

  if (index === -1) {
    return HttpResponse.json(
      { message: 'Приглашение не найдено' },
      { status: 404 }
    );
  }

  mockInvitations.splice(index, 1);

  return HttpResponse.json({
    message: 'Приглашение отменено',
  });
}),

// GET /departments - Получение всех департаментов
http.get(`${API_BASE_URL}/departments`, async () => {
  await delay(300);
  return HttpResponse.json(mockDepartments);
}),

// GET /departments/:id - Получение департамента по ID
http.get(`${API_BASE_URL}/departments/:id`, async ({ params }) => {
  await delay(300);
  const { id } = params;
  const department = mockDepartments.find(d => d.id === id);

  if (!department) {
    return HttpResponse.json(
      { message: 'Департамент не найден' },
      { status: 404 }
    );
  }

  return HttpResponse.json(department);
}),

// POST /departments - Создание департамента
http.post(`${API_BASE_URL}/departments`, async ({ request }) => {
  await delay(800);

  const body: any = await request.json();

  // Валидация
  if (!body.name || body.name.length < 3) {
    return HttpResponse.json(
      { message: 'Название должно содержать минимум 3 символа' },
      { status: 400 }
    );
  }

  // Проверка на дубликат
  const existing = mockDepartments.find(
    d => d.name.toLowerCase() === body.name.toLowerCase()
  );
  if (existing) {
    return HttpResponse.json(
      { message: 'Департамент с таким названием уже существует' },
      { status: 409 }
    );
  }

  // Создание
  const department = {
    id: `dept-${Date.now()}`,
    name: body.name,
    description: body.description,
    managerId: body.managerId,
    employeeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDepartments.push(department);

  return HttpResponse.json(department, { status: 201 });
}),

// PATCH /departments/:id - Обновление департамента
http.patch(`${API_BASE_URL}/departments/:id`, async ({ request, params }) => {
  await delay(800);

  const { id } = params;
  const body: any = await request.json();

  const index = mockDepartments.findIndex(d => d.id === id);

  if (index === -1) {
    return HttpResponse.json(
      { message: 'Департамент не найден' },
      { status: 404 }
    );
  }

  // Валидация
  if (body.name && body.name.length < 3) {
    return HttpResponse.json(
      { message: 'Название должно содержать минимум 3 символа' },
      { status: 400 }
    );
  }

  // Обновление
  mockDepartments[index] = {
    ...mockDepartments[index],
    ...body,
    updatedAt: new Date().toISOString(),
  };

  return HttpResponse.json(mockDepartments[index]);
}),

// DELETE /departments/:id - Удаление департамента
http.delete(`${API_BASE_URL}/departments/:id`, async ({ params }) => {
  await delay(500);

  const { id } = params;
  const index = mockDepartments.findIndex(d => d.id === id);

  if (index === -1) {
    return HttpResponse.json(
      { message: 'Департамент не найден' },
      { status: 404 }
    );
  }

  // Проверка наличия сотрудников
  if (mockDepartments[index].employeeCount > 0) {
    return HttpResponse.json(
      { message: 'Нельзя удалить департамент с сотрудниками' },
      { status: 400 }
    );
  }

  mockDepartments.splice(index, 1);

  return HttpResponse.json({ message: 'Департамент удален' });
}),

// POST /departments/transfer - Перевод сотрудника
http.post(`${API_BASE_URL}/departments/transfer`, async ({ request }) => {
  await delay(700);

  const body: any = await request.json();

  // Валидация
  if (!body.employeeId || !body.fromDepartmentId || !body.toDepartmentId) {
    return HttpResponse.json(
      { message: 'Все поля обязательны' },
      { status: 400 }
    );
  }

  const fromDept = mockDepartments.find(d => d.id === body.fromDepartmentId);
  const toDept = mockDepartments.find(d => d.id === body.toDepartmentId);

  if (!fromDept || !toDept) {
    return HttpResponse.json(
      { message: 'Департамент не найден' },
      { status: 404 }
    );
  }

  // Обновление счетчиков
  fromDept.employeeCount = Math.max(0, fromDept.employeeCount - 1);
  toDept.employeeCount += 1;

  return HttpResponse.json({
    message: 'Сотрудник успешно переведен',
  });
}),

// POST /departments/:id/manager - Назначение руководителя
http.post(`${API_BASE_URL}/departments/:id/manager`, async ({ request, params }) => {
  await delay(500);

  const { id } = params;
  const body: any = await request.json();

  const index = mockDepartments.findIndex(d => d.id === id);

  if (index === -1) {
    return HttpResponse.json(
      { message: 'Департамент не найден' },
      { status: 404 }
    );
  }

  if (!body.managerId) {
    return HttpResponse.json(
      { message: 'ID руководителя обязателен' },
      { status: 400 }
    );
  }

  // Обновление
  mockDepartments[index] = {
    ...mockDepartments[index],
    managerId: body.managerId,
    managerName: 'Новый Руководитель', // TODO: получить из mockUsers
    updatedAt: new Date().toISOString(),
  };

  return HttpResponse.json(mockDepartments[index]);
}),

];