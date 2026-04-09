
import { http, HttpResponse, delay } from 'msw';
import { mockUsers, generateMockTokens, getUserByToken } from './mockData';
import {
  type LoginCredentials,
  type AuthResponse,
  type User,
  UserRoleValues,
} from '@shared/types/customTypes';
import { tasksHandlers } from './handlers/taskHandler'; 
import { incidentsHandlers } from './handlers/incidentMocks';
import { supervisorHandlers } from './handlers/supervisorHandler';
import { casesHandlers } from './handlers/casesHandlers';
import { analyticsHandlers } from './handlers/analyticHandler';
import { rulesHandlers } from './handlers/rulesHandler';
import { strategicHandlers } from './handlers/strategicHandlers';
import { notificationHandlers } from './handlers/notificationhandlers';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/** Как в apiClient: login/register идут на origin без хвоста `/api/v1` */
const AUTH_API_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

const getUserFromAuthHeader = (request: Request): User | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  return getUserByToken(token);
};

// Хранилище приглашений
const mockInvitations: any[] = [];

// Хранилище департаментов (companyId — для мок-фильтрации по компании, в API-ответ не отдаётся)
const mockDepartments: any[] = [
  {
    id: 'dept-001',
    companyId: 'company-1',
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
    companyId: 'company-1',
    name: 'Отдел закупок №2',
    description: 'Дополнительный отдел закупок',
    employeeCount: 3,
    createdAt: '2024-03-20T00:00:00Z',
    updatedAt: '2025-10-15T00:00:00Z',
  },
  {
    id: 'dept-003',
    companyId: 'company-1',
    name: 'Департамент стратегических закупок',
    description: 'Работа с крупными поставщиками',
    managerId: '2',
    managerName: 'Петр Руководителев',
    employeeCount: 8,
    createdAt: '2024-06-10T00:00:00Z',
    updatedAt: '2025-11-05T00:00:00Z',
  },
];

const toClientDepartment = (row: any) => {
  const { companyId: _c, ...rest } = row;
  return rest;
};

// Текущая компания (мутабельное состояние для MSW)
let mockCompanyProfile = {
  id: 'company-1',
  name: 'TrustFlow',
  employeeCount: 126,
};

const mockManagerStats = {
  newIncidents: 12,
  urgentIncidents: 3,
  incidentsTrend: 15, // +15%
  activeCases: 8,
  closedCases: 24,
  myTasks: 15,
  completedTasks: 42,
  overdueTasks: 2,
  performanceScore: 87,
  avgProcessingTime: 4.5,
};

const mockRecentActivities = [
  {
    id: 'activity-1',
    type: 'INCIDENT' as const,
    title: 'Новый инцидент: Превышение бюджета закупки',
    description: 'Закупка №12345 превышает утвержденный бюджет на 15%',
    timestamp: '5 минут назад',
    severity: 'HIGH' as const,
  },
  {
    id: 'activity-2',
    type: 'CASE' as const,
    title: 'Случай обновлен: Дублирование поставщика',
    description: 'Добавлено новое доказательство',
    timestamp: '1 час назад',
  },
  {
    id: 'activity-3',
    type: 'TASK' as const,
    title: 'Задача завершена: Проверить контрагента',
    description: 'Контрагент проверен, нарушений не выявлено',
    timestamp: '2 часа назад',
  },
  {
    id: 'activity-4',
    type: 'INCIDENT' as const,
    title: 'Инцидент закрыт: Конфликт интересов',
    description: 'Инцидент признан ложным срабатыванием',
    timestamp: '3 часа назад',
    severity: 'MEDIUM' as const,
  },
  {
    id: 'activity-5',
    type: 'NOTIFICATION' as const,
    title: 'Новое уведомление от руководителя',
    description: 'План корректирующих действий утвержден',
    timestamp: '4 часа назад',
  },
  {
    id: 'activity-6',
    type: 'CASE' as const,
    title: 'Новый случай назначен',
    description: 'Случай №CS-2024-156 требует расследования',
    timestamp: '5 часов назад',
  },
];

const mockUpcomingTasks = [
  {
    id: 'task-1',
    title: 'Подготовить отчет по инциденту ИН-2024-789',
    dueDate: '2024-12-02T18:00:00Z',
    dueIn: 'Сегодня',
    priority: 'URGENT' as const,
    isOverdue: false,
    caseId: 'case-123',
  },
  {
    id: 'task-2',
    title: 'Проверить документы поставщика ООО "Альфа"',
    dueDate: '2024-12-01T15:00:00Z',
    dueIn: 'Просрочено на 1 день',
    priority: 'HIGH' as const,
    isOverdue: true,
    caseId: 'case-124',
  },
  {
    id: 'task-3',
    title: 'Согласовать план корректирующих действий',
    dueDate: '2024-12-03T12:00:00Z',
    dueIn: 'Завтра',
    priority: 'HIGH' as const,
    isOverdue: false,
    caseId: 'case-125',
  },
  {
    id: 'task-4',
    title: 'Провести анализ закупок за ноябрь',
    dueDate: '2024-12-05T17:00:00Z',
    dueIn: '3 дня',
    priority: 'NORMAL' as const,
    isOverdue: false,
  },
  {
    id: 'task-5',
    title: 'Обновить профиль риска контрагента',
    dueDate: '2024-12-06T10:00:00Z',
    dueIn: '4 дня',
    priority: 'LOW' as const,
    isOverdue: false,
    caseId: 'case-126',
  },
];




export const handlers = [
  // ==================== AUTH HANDLERS ====================

  // POST /auth/login - Вход в систему (URL как у реального клиента)
  http.post(`${AUTH_API_BASE_URL}/auth/login`, async ({ request }) => {
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
http.post(`${AUTH_API_BASE_URL}/auth/register`, async ({ request }) => {
  await delay(700);
  const body = await request.json() as {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: User['role'];
    companyName?: string;
  };
  const existing = mockUsers.find(u => u.email === body.email);
  if (existing) {
    return HttpResponse.json(
      { message: 'Пользователь с таким email уже существует', code: 'DUPLICATE_EMAIL' },
      { status: 409 }
    );
  }
  if (
    body.role === UserRoleValues.EXECUTIVE &&
    (!body.companyName || body.companyName.trim().length < 2)
  ) {
    return HttpResponse.json(
      { message: 'Для роли ТОП-менеджмент укажите название компании' },
      { status: 400 }
    );
  }
  const id = (Math.max(...mockUsers.map(u => +u.id || 0), 0) + 1).toString();
  // Имплементация isFirstLogin=true!
  const user: User & { password: string }  = {
    id,
    email: body.email,
    firstName: body.firstName,
    lastName: body.lastName,
    role: body.role,
    companyId: mockCompanyProfile.id,
    isFirstLogin: true,
    password: body.password,
  };
  if (body.role === UserRoleValues.EXECUTIVE && body.companyName?.trim()) {
    mockCompanyProfile = {
      ...mockCompanyProfile,
      name: body.companyName.trim(),
    };
  }
  mockUsers.push(user);
  const tokens = generateMockTokens(id);
  const { password: _p, ...userWithoutPassword } = user;
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

// GET /companies/:companyId/departments — департаменты компании
http.get(`${API_BASE_URL}/companies/:companyId/departments`, async ({ params }) => {
  await delay(300);
  const { companyId } = params;
  const list = mockDepartments
    .filter((d) => d.companyId === companyId)
    .map(toClientDepartment);

  return HttpResponse.json(list);
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

  return HttpResponse.json(toClientDepartment(department));
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

  const targetCompanyId = body.companyId || mockCompanyProfile.id;

  // Проверка на дубликат
  const existing = mockDepartments.find(
    d =>
      d.companyId === targetCompanyId &&
      d.name.toLowerCase() === body.name.toLowerCase()
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
    companyId: targetCompanyId,
    name: body.name,
    description: body.description,
    managerId: body.managerId,
    employeeCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockDepartments.push(department);

  return HttpResponse.json(toClientDepartment(department), { status: 201 });
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

  const { companyId: _ignoreCompany, ...updates } = body;

  // Обновление
  mockDepartments[index] = {
    ...mockDepartments[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  return HttpResponse.json(toClientDepartment(mockDepartments[index]));
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

  return HttpResponse.json(toClientDepartment(mockDepartments[index]));
}),

// GET /company — профиль компании (все авторизованные роли)
http.get(`${API_BASE_URL}/company`, async ({ request }) => {
  await delay(300);
  const user = getUserFromAuthHeader(request);
  if (!user) {
    return HttpResponse.json(
      { message: 'Unauthorized', code: 'MISSING_OR_INVALID_TOKEN' },
      { status: 401 }
    );
  }
  return HttpResponse.json(mockCompanyProfile);
}),

// PATCH /company — обновление наименования (только топ-менеджмент)
http.patch(`${API_BASE_URL}/company`, async ({ request }) => {
  await delay(700);
  const user = getUserFromAuthHeader(request);
  if (!user) {
    return HttpResponse.json(
      { message: 'Unauthorized', code: 'MISSING_OR_INVALID_TOKEN' },
      { status: 401 }
    );
  }
  if (user.role !== UserRoleValues.EXECUTIVE) {
    return HttpResponse.json(
      { message: 'Доступно только топ-менеджменту' },
      { status: 403 }
    );
  }

  const body = (await request.json()) as { name?: string };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (name.length < 2) {
    return HttpResponse.json(
      { message: 'Наименование должно содержать минимум 2 символа' },
      { status: 400 }
    );
  }

  mockCompanyProfile = { ...mockCompanyProfile, name };
  return HttpResponse.json(mockCompanyProfile);
}),

  // GET /dashboard/manager/stats - Статистика для менеджера
  http.get(`${API_BASE_URL}/dashboard/manager/stats`, async () => {
    await delay(500);
    console.log('📊 [MSW] Fetching manager dashboard stats');
    return HttpResponse.json(mockManagerStats);
  }),

  // GET /dashboard/manager/activities - Последние активности
  http.get(`${API_BASE_URL}/dashboard/manager/activities`, async () => {
    await delay(400);
    console.log('📋 [MSW] Fetching recent activities');
    return HttpResponse.json(mockRecentActivities);
  }),

  // GET /dashboard/manager/tasks - Предстоящие задачи
  http.get(`${API_BASE_URL}/dashboard/manager/tasks`, async () => {
    await delay(300);
    console.log('✅ [MSW] Fetching upcoming tasks');
    return HttpResponse.json(mockUpcomingTasks);
  }),

  // GET /dashboard/supervisor/stats - Статистика для руководителя
  http.get(`${API_BASE_URL}/dashboard/supervisor/stats`, async () => {
    await delay(500);
    console.log('📊 [MSW] Fetching supervisor dashboard stats');
    return HttpResponse.json({
      ...mockManagerStats,
      teamMembers: 8,
      teamPerformance: 85,
      pendingVerifications: 5,
    });
  }),

  // GET /dashboard/executive/stats - Статистика для топ-менеджмента
  http.get(`${API_BASE_URL}/dashboard/executive/stats`, async () => {
    await delay(500);
    console.log('📊 [MSW] Fetching executive dashboard stats');
    return HttpResponse.json({
      totalRisk: 65,
      financialImpact: 2500000,
      topRiskAreas: ['Закупки', 'Контрагенты', 'Финансы'],
      complianceScore: 92,
    });
  }),
 

  ...tasksHandlers,
  ...incidentsHandlers,
  ...supervisorHandlers,
  ...casesHandlers,
  ...analyticsHandlers, 
  ...rulesHandlers,
  ...strategicHandlers,
  ...notificationHandlers

];