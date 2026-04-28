// src/mocks/handlers_tasks.ts

import { http, HttpResponse, delay } from 'msw';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  ActionPlan,
  CreateActionPlanRequest,
  UpdateTaskRequest,
  TaskAttachment,
} from '@shared/types/taskTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Моковые данные задач
let mockTasks: Task[] = [
  {
    id: 'TASK-001',
    title: 'Пересмотреть регламент согласования бюджета',
    description: 'Необходимо добавить этап контроля изменения цен после согласования бюджета',
    status: 'TODO' as TaskStatus,
    priority: 'HIGH' as TaskPriority,
    actionPlanId: 'AP-2024-001',
    caseId: 'CS-2024-004',
    caseTitle: 'Систематические задержки поставок',
    assigneeId: '1',
    assigneeName: 'Иван Иванов',
    createdBy: '1',
    createdByName: 'Иван Иванов',
    createdAt: '2024-11-29T10:00:00Z',
    updatedAt: '2024-11-29T10:00:00Z',
    dueDate: '2024-12-06T23:59:59Z',
    isOverdue: false,
    daysUntilDue: 4,
  },
  {
    id: 'TASK-002',
    title: 'Провести обучение для отдела закупок',
    description: 'Обучить сотрудников новым процедурам контроля изменения цен',
    status: 'IN_PROGRESS' as TaskStatus,
    priority: 'NORMAL' as TaskPriority,
    actionPlanId: 'AP-2024-001',
    caseId: 'CS-2024-004',
    caseTitle: 'Систематические задержки поставок',
    assigneeId: '1',
    assigneeName: 'Иван Иванов',
    createdBy: '1',
    createdByName: 'Иван Иванов',
    createdAt: '2024-11-29T10:00:00Z',
    updatedAt: '2024-12-01T14:20:00Z',
    dueDate: '2024-12-08T23:59:59Z',
    isOverdue: false,
    daysUntilDue: 6,
  },
  {
    id: 'TASK-003',
    title: 'Создать заявку в IT на доработку системы',
    description: 'Добавить автоматическое уведомление при изменении цен поставщиком',
    status: 'TODO' as TaskStatus,
    priority: 'URGENT' as TaskPriority,
    actionPlanId: 'AP-2024-001',
    caseId: 'CS-2024-004',
    caseTitle: 'Систематические задержки поставок',
    assigneeId: '1',
    assigneeName: 'Иван Иванов',
    createdBy: '1',
    createdByName: 'Иван Иванов',
    createdAt: '2024-11-29T10:00:00Z',
    updatedAt: '2024-11-29T10:00:00Z',
    dueDate: '2024-12-04T23:59:59Z',
    isOverdue: false,
    daysUntilDue: 2,
  },
  {
    id: 'TASK-004',
    title: 'Проверить документы поставщика ООО "Альфа"',
    description: 'Запросить и проверить актуальные учредительные документы',
    status: 'TODO' as TaskStatus,
    priority: 'HIGH' as TaskPriority,
    assigneeId: '1',
    assigneeName: 'Иван Иванов',
    createdBy: '2',
    createdByName: 'Петр Петров',
    createdAt: '2024-12-01T09:00:00Z',
    updatedAt: '2024-12-01T09:00:00Z',
    dueDate: '2024-12-01T23:59:59Z',
    isOverdue: true,
    daysUntilDue: -1,
  },
  {
    id: 'TASK-005',
    title: 'Подготовить отчет по инциденту ИН-2024-789',
    description: 'Сформировать детальный отчет о расследовании инцидента',
    status: 'DONE' as TaskStatus,
    priority: 'URGENT' as TaskPriority,
    assigneeId: '1',
    assigneeName: 'Иван Иванов',
    createdBy: '1',
    createdByName: 'Иван Иванов',
    createdAt: '2024-11-25T10:00:00Z',
    updatedAt: '2024-11-27T16:30:00Z',
    dueDate: '2024-11-27T23:59:59Z',
    completedAt: '2024-11-27T16:30:00Z',
    isOverdue: false,
    daysUntilDue: 0,
    evidenceDescription: 'Отчет подготовлен и отправлен руководителю. Все необходимые документы прикреплены.',
    evidenceAttachments: [
      {
        id: 'evidence-1',
        taskId: 'TASK-005',
        fileName: 'Отчет_инцидент_789.pdf',
        fileUrl: '/files/report_789.pdf',
        fileSize: 450000,
        fileType: 'application/pdf',
        uploadedAt: '2024-11-27T16:25:00Z',
      },
    ],
  },
];

// Моковые данные планов действий
let mockActionPlans: ActionPlan[] = [
  {
    id: 'AP-2024-001',
    caseId: 'CS-2024-004',
    caseTitle: 'Систематические задержки поставок',
    title: 'План корректирующих действий для случая CS-2024-004',
    description: 'Недостаточная производственная мощность поставщика для выполнения обязательств',
    status: 'IN_PROGRESS',
    createdBy: '1',
    createdByName: 'Иван Иванов',
    createdAt: '2024-11-29T10:00:00Z',
    approvedBy: '2',
    approvedByName: 'Петр Петров',
    approvedAt: '2024-11-30T09:00:00Z',
    tasks: mockTasks.filter(t => t.actionPlanId === 'AP-2024-001'),
    totalTasks: 3,
    completedTasks: 0,
    progressPercentage: 0,
  },
];

export const tasksHandlers = [
  // GET /tasks/my - Получить мои задачи
  http.get(`${API_BASE_URL}/tasks/my`, async () => {
    await delay(400);
    console.log('✅ [MSW] Fetching my tasks');
    return HttpResponse.json(mockTasks);
  }),

  // GET /tasks/statistics - Статистика по задачам
  http.get(`${API_BASE_URL}/tasks/statistics`, async () => {
    await delay(300);
    console.log('📊 [MSW] Fetching task statistics');
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const statistics = {
      total: mockTasks.length,
      todo: mockTasks.filter(t => t.status === 'TODO').length,
      inProgress: mockTasks.filter(t => t.status === 'IN_PROGRESS').length,
      done: mockTasks.filter(t => t.status === 'DONE').length,
      blocked: mockTasks.filter(t => t.status === 'BLOCKED').length,
      overdue: mockTasks.filter(t => t.isOverdue).length,
      dueToday: mockTasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate >= today && dueDate < tomorrow;
      }).length,
      dueTomorrow: mockTasks.filter(t => {
        const dueDate = new Date(t.dueDate);
        return dueDate >= tomorrow && dueDate < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);
      }).length,
    };
    
    return HttpResponse.json(statistics);
  }),

  // GET /tasks/:taskId - Получить задачу по ID
  http.get(`${API_BASE_URL}/tasks/:taskId`, async ({ params }) => {
    await delay(300);
    const { taskId } = params;
    console.log(`📄 [MSW] Fetching task: ${taskId}`);
    
    const task = mockTasks.find(t => t.id === taskId);
    
    if (!task) {
      return HttpResponse.json(
        { message: 'Задача не найдена', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(task);
  }),

/// PATCH /tasks/:taskId - Обновить задачу
http.patch(`${API_BASE_URL}/tasks/:taskId`, async ({ request, params }) => {
  await delay(400);
  const { taskId } = params;
  const safeTaskId = Array.isArray(taskId) ? taskId[0] : taskId ?? '';

  const body = await request.json() as UpdateTaskRequest;
  console.log(`✏️ [MSW] Updating task ${safeTaskId}:`, body);

  const index = mockTasks.findIndex(t => t.id === safeTaskId);
  if (index === -1) {
    return HttpResponse.json(
      { message: 'Задача не найдена', code: 'TASK_NOT_FOUND' },
      { status: 404 }
    );
  }

  let evidenceAttachments: TaskAttachment[] | undefined = undefined;
  if (body.evidenceAttachments) {
    evidenceAttachments = body.evidenceAttachments.map((file, i) => ({
      id: `evidence-${Date.now()}-${i}`,
      taskId: safeTaskId,
      fileName: file.name,
      fileUrl: `/uploads/${file.name}`,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
    }));
  }

  mockTasks[index] = {
    ...mockTasks[index],
    ...body,
    evidenceAttachments,
    updatedAt: new Date().toISOString(),
  };

  return HttpResponse.json(mockTasks[index]);
}),



  // POST /tasks/:taskId/complete - Завершить задачу
  http.post(`${API_BASE_URL}/tasks/:taskId/complete`, async ({ request, params }) => {
    await delay(400);
    const { taskId } = params;
    const body = await request.json() as { evidenceDescription: string };
    console.log(`✅ [MSW] Completing task ${taskId}`);
    
    const index = mockTasks.findIndex(t => t.id === taskId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Задача не найдена', code: 'TASK_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockTasks[index] = {
      ...mockTasks[index],
      status: 'DONE' as TaskStatus,
      evidenceDescription: body.evidenceDescription,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Обновить прогресс плана
    if (mockTasks[index].actionPlanId) {
      const planIndex = mockActionPlans.findIndex(p => p.id === mockTasks[index].actionPlanId);
      if (planIndex !== -1) {
        const planTasks = mockTasks.filter(t => t.actionPlanId === mockActionPlans[planIndex].id);
        const completedTasks = planTasks.filter(t => t.status === 'DONE').length;
        mockActionPlans[planIndex].completedTasks = completedTasks;
        mockActionPlans[planIndex].progressPercentage = Math.round((completedTasks / planTasks.length) * 100);
        
        if (completedTasks === planTasks.length) {
          mockActionPlans[planIndex].status = 'COMPLETED';
        }
      }
    }
    
    return HttpResponse.json(mockTasks[index]);
  }),

  // POST /tasks/:taskId/evidence - Загрузить доказательство
  http.post(`${API_BASE_URL}/tasks/:taskId/evidence`, async ({ request, params }) => {
    await delay(600);
    const { taskId } = params;
    console.log(`📤 [MSW] Uploading evidence for task ${taskId}`);
    
    // Симуляция успешной загрузки
    return HttpResponse.json({ message: 'Доказательство загружено' }, { status: 201 });
  }),

  // GET /action-plans - Получить все планы действий
  http.get(`${API_BASE_URL}/action-plans`, async () => {
    await delay(400);
    console.log('📋 [MSW] Fetching action plans');
    
    // Обновить задачи в планах
    mockActionPlans.forEach(plan => {
      plan.tasks = mockTasks.filter(t => t.actionPlanId === plan.id);
      plan.totalTasks = plan.tasks.length;
      plan.completedTasks = plan.tasks.filter(t => t.status === 'DONE').length;
      plan.progressPercentage = plan.totalTasks > 0 
        ? Math.round((plan.completedTasks / plan.totalTasks) * 100) 
        : 0;
    });
    
    return HttpResponse.json(mockActionPlans);
  }),

  // GET /action-plans/:planId - Получить план по ID
  http.get(`${API_BASE_URL}/action-plans/:planId`, async ({ params }) => {
    await delay(300);
    const { planId } = params;
    console.log(`📄 [MSW] Fetching action plan: ${planId}`);
    
    const plan = mockActionPlans.find(p => p.id === planId);
    
    if (!plan) {
      return HttpResponse.json(
        { message: 'План не найден', code: 'PLAN_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Обновить задачи в плане
    plan.tasks = mockTasks.filter(t => t.actionPlanId === plan.id);
    plan.totalTasks = plan.tasks.length;
    plan.completedTasks = plan.tasks.filter(t => t.status === 'DONE').length;
    plan.progressPercentage = plan.totalTasks > 0 
      ? Math.round((plan.completedTasks / plan.totalTasks) * 100) 
      : 0;
    
    return HttpResponse.json(plan);
  }),

  // POST /api/action-plans - Создать план действий
  http.post(`${API_BASE_URL.replace('/api/v1', '')}/api/action-plans`, async ({ request }) => {
    await delay(600);
    const body = await request.json() as CreateActionPlanRequest;
    console.log('➕ [MSW] Creating action plan:', body);
    
    const newPlanId = `AP-2024-${String(mockActionPlans.length + 1).padStart(3, '0')}`;
    
    // Создать задачи плана
    const newTasks: Task[] = body.tasks.map((taskReq, index) => ({
      id: `TASK-${String(mockTasks.length + index + 1).padStart(3, '0')}`,
      title: taskReq.title,
      description: taskReq.description,
      status: 'TODO' as TaskStatus,
      priority: taskReq.priority,
      actionPlanId: newPlanId,
      caseId: body.caseId,
      assigneeId: taskReq.assigneeId,
      assigneeName: 'Иван Иванов',
      createdBy: '1',
      createdByName: 'Иван Иванов',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: taskReq.dueDate,
      isOverdue: false,
      daysUntilDue: Math.floor((new Date(taskReq.dueDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    }));
    
    mockTasks.push(...newTasks);
    
    const newPlan: ActionPlan = {
      id: newPlanId,
      caseId: body.caseId,
      caseTitle: `Случай ${body.caseId}`,
      title: body.title,
      description: body.description,
      status: 'DRAFT',
      createdBy: '1',
      createdByName: 'Иван Иванов',
      createdAt: new Date().toISOString(),
      tasks: newTasks,
      totalTasks: newTasks.length,
      completedTasks: 0,
      progressPercentage: 0,
    };
    
    mockActionPlans.push(newPlan);
    return HttpResponse.json(newPlan, { status: 201 });
  }),

  // POST /action-plans/:planId/submit - Отправить план на верификацию
  http.post(`${API_BASE_URL}/action-plans/:planId/submit`, async ({ params }) => {
    await delay(400);
    const { planId } = params;
    console.log(`📤 [MSW] Submitting action plan ${planId} for verification`);
    
    const index = mockActionPlans.findIndex(p => p.id === planId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'План не найден', code: 'PLAN_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockActionPlans[index] = {
      ...mockActionPlans[index],
      status: 'PENDING_APPROVAL',
    };
    
    return HttpResponse.json(mockActionPlans[index]);
  }),
];
