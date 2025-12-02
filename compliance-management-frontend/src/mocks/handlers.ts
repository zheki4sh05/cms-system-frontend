
import { http, HttpResponse, delay } from 'msw';
import { mockUsers, generateMockTokens, getUserByToken } from './mockData';
import { type LoginCredentials, type AuthResponse, UserRoleValues } from '@shared/types/customTypes';
import type {User} from '../shared/types/customTypes'
import type {
  Case,
  CaseStatus,
  CaseSeverity,
  CasePriority,
  CaseComment,
  CaseAttachment,
  CreateCaseRequest,
  UpdateCaseRequest,
} from '@shared/types/caseTypes';
import { tasksHandlers } from './handlers/taskHandler'; 
import { incidentsHandlers } from './handlers/incidentMocks';


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


// Моковые данные случаев
let mockCases: Case[] = [
  {
    id: 'CS-2024-001',
    title: 'Превышение бюджета закупки на 23%',
    description: 'Обнаружено превышение утвержденного бюджета при закупке офисной техники. Сумма превышения составляет 450 000 руб.',
    status: 'INVESTIGATION' as CaseStatus,
    severity: 'HIGH' as CaseSeverity,
    priority: 'HIGH' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-28T10:00:00Z',
    updatedAt: '2024-12-01T15:30:00Z',
    dueDate: '2024-12-10T23:59:59Z',
    incidentIds: ['INC-2024-123', 'INC-2024-124'],
    tags: ['финансы', 'бюджет', 'закупки'],
    investigationNotes: 'Проведен анализ документов. Выявлено изменение цен поставщиком после согласования.',
    rootCause: 'Отсутствие механизма контроля изменения цен после согласования бюджета',
    requiresCorrectiveAction: true,
  },
  {
    id: 'CS-2024-002',
    title: 'Дублирование записей поставщика ООО "Альфа"',
    description: 'В базе данных обнаружено три записи для одного и того же поставщика с разными идентификаторами.',
    status: 'IN_PROGRESS' as CaseStatus,
    severity: 'MEDIUM' as CaseSeverity,
    priority: 'NORMAL' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-25T09:00:00Z',
    updatedAt: '2024-11-30T14:20:00Z',
    dueDate: '2024-12-05T23:59:59Z',
    incidentIds: ['INC-2024-110'],
    tags: ['контрагенты', 'данные'],
    investigationNotes: 'Записи созданы разными сотрудниками в разное время. Требуется объединение.',
    requiresCorrectiveAction: false,
  },
  {
    id: 'CS-2024-003',
    title: 'Подозрение на конфликт интересов',
    description: 'Менеджер проводит закупки у компании, где он является совладельцем согласно данным ЕГРЮЛ.',
    status: 'OPEN' as CaseStatus,
    severity: 'CRITICAL' as CaseSeverity,
    priority: 'URGENT' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-12-01T11:00:00Z',
    updatedAt: '2024-12-01T11:00:00Z',
    dueDate: '2024-12-03T23:59:59Z',
    incidentIds: ['INC-2024-156'],
    tags: ['комплаенс', 'этика', 'критично'],
    requiresCorrectiveAction: false,
  },
  {
    id: 'CS-2024-004',
    title: 'Систематические задержки поставок',
    description: 'Поставщик ООО "Бета" систематически нарушает сроки поставки (7 случаев за 3 месяца).',
    status: 'PENDING_VERIFICATION' as CaseStatus,
    severity: 'LOW' as CaseSeverity,
    priority: 'NORMAL' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-20T08:00:00Z',
    updatedAt: '2024-11-29T16:45:00Z',
    dueDate: '2024-12-08T23:59:59Z',
    incidentIds: ['INC-2024-098', 'INC-2024-105', 'INC-2024-112'],
    tags: ['логистика', 'поставщик'],
    investigationNotes: 'Проведена встреча с поставщиком. Выявлены проблемы с производственными мощностями.',
    rootCause: 'Недостаточная производственная мощность поставщика для выполнения обязательств',
    requiresCorrectiveAction: true,
    actionPlanId: 'AP-2024-001',
  },
  {
    id: 'CS-2024-005',
    title: 'Закрытый случай: Ложное срабатывание правила',
    description: 'Правило сработало на допустимое исключение, утвержденное руководством.',
    status: 'CLOSED' as CaseStatus,
    severity: 'LOW' as CaseSeverity,
    priority: 'LOW' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-15T10:00:00Z',
    updatedAt: '2024-11-16T12:00:00Z',
    incidentIds: ['INC-2024-067'],
    tags: ['система', 'настройка'],
    investigationNotes: 'Подтверждено наличие утверждения от руководства.',
    rootCause: 'Правило не учитывает исключения, утвержденные руководством',
    requiresCorrectiveAction: false,
  },
];

// Комментарии к случаям
let mockComments: CaseComment[] = [
  {
    id: 'comment-1',
    caseId: 'CS-2024-001',
    authorId: '1',
    authorName: 'Иван Иванов',
    content: 'Запросил документы у отдела закупок. Ожидаю ответа в течение 2 рабочих дней.',
    createdAt: '2024-11-28T14:30:00Z',
  },
  {
    id: 'comment-2',
    caseId: 'CS-2024-001',
    authorId: '1',
    authorName: 'Иван Иванов',
    content: 'Получены документы. Подтверждено, что поставщик изменил цены после согласования без уведомления.',
    createdAt: '2024-11-29T10:15:00Z',
  },
  {
    id: 'comment-3',
    caseId: 'CS-2024-002',
    authorId: '1',
    authorName: 'Иван Иванов',
    content: 'Связался с IT-отделом для технической проверки возможности объединения записей.',
    createdAt: '2024-11-26T09:45:00Z',
  },
];

// Вложения к случаям
let mockAttachments: CaseAttachment[] = [
  {
    id: 'attach-1',
    caseId: 'CS-2024-001',
    fileName: 'Договор_поставки_123.pdf',
    fileUrl: '/files/contract_123.pdf',
    fileSize: 245000,
    fileType: 'application/pdf',
    uploadedBy: 'Иван Иванов',
    uploadedAt: '2024-11-28T15:00:00Z',
  },
  {
    id: 'attach-2',
    caseId: 'CS-2024-001',
    fileName: 'Скан_счета_на_оплату.jpg',
    fileUrl: '/files/invoice_scan.jpg',
    fileSize: 1200000,
    fileType: 'image/jpeg',
    uploadedBy: 'Иван Иванов',
    uploadedAt: '2024-11-29T11:30:00Z',
  },
  {
    id: 'attach-3',
    caseId: 'CS-2024-003',
    fileName: 'Выписка_ЕГРЮЛ.pdf',
    fileUrl: '/files/egrul.pdf',
    fileSize: 340000,
    fileType: 'application/pdf',
    uploadedBy: 'Иван Иванов',
    uploadedAt: '2024-12-01T12:00:00Z',
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
  // GET /cases/my - Получить мои случаи
  http.get(`${API_BASE_URL}/cases/my`, async () => {
    await delay(400);
    console.log('📁 [MSW] Fetching my cases');
    return HttpResponse.json(mockCases);
  }),

  // GET /cases/statistics - Статистика по случаям
  http.get(`${API_BASE_URL}/cases/statistics`, async () => {
    await delay(300);
    console.log('📊 [MSW] Fetching case statistics');
    
    const statistics = {
      total: mockCases.length,
      open: mockCases.filter(c => c.status === 'OPEN').length,
      inProgress: mockCases.filter(c => c.status === 'IN_PROGRESS').length,
      investigation: mockCases.filter(c => c.status === 'INVESTIGATION').length,
      pendingVerification: mockCases.filter(c => c.status === 'PENDING_VERIFICATION').length,
      closed: mockCases.filter(c => c.status === 'CLOSED').length,
      avgResolutionTime: 48, // В часах
    };
    
    return HttpResponse.json(statistics);
  }),

  // GET /cases/:caseId - Получить случай по ID
  http.get(`${API_BASE_URL}/cases/:caseId`, async ({ params }) => {
    await delay(300);
    const { caseId } = params;
    console.log(`📄 [MSW] Fetching case: ${caseId}`);
    
    const caseItem = mockCases.find(c => c.id === caseId);
    
    if (!caseItem) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(caseItem);
  }),

  // POST /cases - Создать новый случай
  http.post(`${API_BASE_URL}/cases`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as CreateCaseRequest;
    console.log('➕ [MSW] Creating new case:', body);
    
    const newCase: Case = {
      id: `CS-2024-${String(mockCases.length + 1).padStart(3, '0')}`,
      title: body.title,
      description: body.description,
      status: 'OPEN' as CaseStatus,
      severity: body.severity,
      priority: body.priority,
      ownerId: '1',
      ownerName: 'Иван Иванов',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // +14 дней
      incidentIds: body.incidentIds || [],
      tags: body.tags || [],
      requiresCorrectiveAction: false,
    };
    
    mockCases.push(newCase);
    return HttpResponse.json(newCase, { status: 201 });
  }),

  // PATCH /cases/:caseId - Обновить случай
  http.patch(`${API_BASE_URL}/cases/:caseId`, async ({ request, params }) => {
    await delay(400);
    const { caseId } = params;
    const body = await request.json() as UpdateCaseRequest;
    console.log(`✏️ [MSW] Updating case ${caseId}:`, body);
    
    const index = mockCases.findIndex(c => c.id === caseId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockCases[index] = {
      ...mockCases[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockCases[index]);
  }),

  // POST /cases/:caseId/close - Закрыть случай
  http.post(`${API_BASE_URL}/cases/:caseId/close`, async ({ request, params }) => {
    await delay(400);
    const { caseId } = params;
    const body = await request.json() as { conclusion: string };
    console.log(`✅ [MSW] Closing case ${caseId}`);
    
    const index = mockCases.findIndex(c => c.id === caseId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockCases[index] = {
      ...mockCases[index],
      status: 'CLOSED' as CaseStatus,
      rootCause: body.conclusion,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockCases[index]);
  }),

  // GET /cases/:caseId/comments - Получить комментарии к случаю
  http.get(`${API_BASE_URL}/cases/:caseId/comments`, async ({ params }) => {
    await delay(300);
    const { caseId } = params;
    console.log(`💬 [MSW] Fetching comments for case: ${caseId}`);
    
    const comments = mockComments.filter(c => c.caseId === caseId);
    return HttpResponse.json(comments);
  }),

  // POST /cases/:caseId/comments - Добавить комментарий
  http.post(`${API_BASE_URL}/cases/:caseId/comments`, async ({ request, params }) => {
    await delay(400);
    const { caseId } = params;
    const body = await request.json() as { content: string };
    console.log(`💬 [MSW] Adding comment to case ${caseId}`);
    
    const newComment: CaseComment = {
      id: `comment-${mockComments.length + 1}`,
      caseId: caseId as string,
      authorId: '1',
      authorName: 'Иван Иванов',
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    
    mockComments.push(newComment);
    return HttpResponse.json(newComment, { status: 201 });
  }),

  // GET /cases/:caseId/attachments - Получить вложения случая
  http.get(`${API_BASE_URL}/cases/:caseId/attachments`, async ({ params }) => {
    await delay(300);
    const { caseId } = params;
    console.log(`📎 [MSW] Fetching attachments for case: ${caseId}`);
    
    const attachments = mockAttachments.filter(a => a.caseId === caseId);
    return HttpResponse.json(attachments);
  }),

  // POST /cases/:caseId/attachments - Загрузить вложение
  http.post(`${API_BASE_URL}/cases/:caseId/attachments`, async ({ request, params }) => {
    await delay(600);
    const { caseId } = params;
    console.log(`📤 [MSW] Uploading attachment to case ${caseId}`);
    
    // Симуляция получения файла из FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return HttpResponse.json(
        { message: 'Файл не предоставлен', code: 'NO_FILE' },
        { status: 400 }
      );
    }
    
    const newAttachment: CaseAttachment = {
      id: `attach-${mockAttachments.length + 1}`,
      caseId: caseId as string,
      fileName: file.name,
      fileUrl: `/files/${file.name}`,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy: 'Иван Иванов',
      uploadedAt: new Date().toISOString(),
    };
    
    mockAttachments.push(newAttachment);
    return HttpResponse.json(newAttachment, { status: 201 });
  }),

  ...tasksHandlers,
  ...incidentsHandlers

];