// src/shared/lib/api/taskApi.ts

import { apiClient } from './apiClient';
import {
  TaskPriority,
  TaskStatus,
  type Task,
  type ActionPlan,
  type CreateActionPlanRequest,
  type CreateActionPlanApiRequest,
  type UpdateActionPlanRequest,
  type SubmitActionPlanResponse,
  type UpdateTaskRequest,
  type TaskStatistics,
} from '@shared/types/taskTypes';

/** Сырой ответ API: title/description иногда приходят не строкой */
type ActionPlanApiPayload = Omit<
  Partial<ActionPlan>,
  'title' | 'description' | 'comment' | 'riskObjectName' | 'details'
> & {
  id: string;
  caseId: string;
  title?: unknown;
  description?: unknown;
  comment?: unknown;
  riskObjectName?: unknown;
  details?: unknown;
};

function planFieldToString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }
  return String(value);
}

/** Комментарий плана в API — строка или null */
function coercePlanComment(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') return value;
  return planFieldToString(value) || null;
}

function normalizeTaskPriority(value: unknown): TaskPriority {
  if (typeof value === 'string') {
    const u = value.toUpperCase();
    if (u === 'LOW' || u === 'NORMAL' || u === 'HIGH' || u === 'URGENT') {
      return u as TaskPriority;
    }
  }
  return TaskPriority.NORMAL;
}

function normalizeTaskStatus(value: unknown): TaskStatus {
  if (typeof value === 'string') {
    const u = value.toUpperCase();
    if (u === 'TODO' || u === 'IN_PROGRESS' || u === 'DONE' || u === 'BLOCKED') {
      return u as TaskStatus;
    }
  }
  return TaskStatus.TODO;
}

function normalizeRiskObjectName(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'object') {
    if (Object.keys(value as object).length === 0) return undefined;
  }
  const s = planFieldToString(value).trim();
  if (!s || s === '{}' || s === '[]') return undefined;
  return s;
}

function normalizePlanDetails(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const o = value as Record<string, unknown>;
  if (Object.keys(o).length === 0) return undefined;
  return o;
}

function coerceCaseId(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value == null) return undefined;
  const s = planFieldToString(value);
  return s || undefined;
}

function dueInDays(dueDate: string): number {
  const t = new Date(dueDate).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.floor((t - Date.now()) / (24 * 60 * 60 * 1000));
}

/** Нормализация задачи из ответа API (в т.ч. POST /api/action-plans) */
function coerceTask(raw: unknown): Task {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.NORMAL,
      assigneeId: '',
      assigneeName: '',
      createdBy: '',
      createdByName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date().toISOString(),
      isOverdue: false,
      daysUntilDue: 0,
    };
  }

  const o = raw as Record<string, unknown>;
  const dueDate =
    typeof o.dueDate === 'string' && o.dueDate.length > 0
      ? o.dueDate
      : new Date().toISOString();
  const days = dueInDays(dueDate);

  return {
    id: typeof o.id === 'string' ? o.id : '',
    title: planFieldToString(o.title),
    description: planFieldToString(o.description),
    status: normalizeTaskStatus(o.status),
    priority: normalizeTaskPriority(o.priority),
    actionPlanId: typeof o.actionPlanId === 'string' ? o.actionPlanId : undefined,
    caseId: coerceCaseId(o.caseId),
    caseStatus: o.caseStatus,
    assigneeId: typeof o.assigneeId === 'string' ? o.assigneeId : '',
    assigneeName: typeof o.assigneeName === 'string' ? o.assigneeName : '',
    createdBy: typeof o.createdBy === 'string' ? o.createdBy : '',
    createdByName: typeof o.createdByName === 'string' ? o.createdByName : '',
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
    updatedAt: typeof o.updatedAt === 'string' ? o.updatedAt : new Date().toISOString(),
    dueDate,
    completedAt: typeof o.completedAt === 'string' ? o.completedAt : undefined,
    evidenceDescription: typeof o.evidenceDescription === 'string' ? o.evidenceDescription : undefined,
    evidenceDescriptionInprogress: o.evidenceDescriptionInprogress,
    evidenceDescriptionDone: o.evidenceDescriptionDone,
    isOverdue: typeof o.isOverdue === 'boolean' ? o.isOverdue : days < 0,
    daysUntilDue: typeof o.daysUntilDue === 'number' ? o.daysUntilDue : days,
  };
}

function coerceActionPlan(raw: ActionPlanApiPayload): ActionPlan {
  const title = planFieldToString(raw.title);
  const description = planFieldToString(raw.description);
  const tasksRaw = raw.tasks ?? [];
  const tasks = Array.isArray(tasksRaw) ? tasksRaw.map((t) => coerceTask(t)) : [];
  const totalTasks = raw.totalTasks ?? tasks.length;
  const completedTasks =
    raw.completedTasks ?? tasks.filter((t) => t.status === 'DONE').length;
  const progressPercentage =
    raw.progressPercentage ??
    (totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

  const comment = coercePlanComment(raw.comment);

  return {
    ...raw,
    title,
    description,
    ...(comment !== undefined ? { comment } : {}),
    caseTitle: raw.caseTitle ?? raw.caseId,
    caseStatus:
      typeof raw.caseStatus === 'string'
        ? raw.caseStatus
        : raw.caseStatus != null
          ? planFieldToString(raw.caseStatus)
          : undefined,
    status: raw.status ?? 'DRAFT',
    riskObjectName: normalizeRiskObjectName(raw.riskObjectName),
    details: normalizePlanDetails(raw.details),
    tasks,
    totalTasks,
    completedTasks,
    progressPercentage,
    createdBy: raw.createdBy ?? '',
    createdByName: raw.createdByName ?? '',
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export class TaskApi {
  /**
   * Получить все задачи текущего пользователя
   */
  static async getMyTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks/my');
    return response.data;
  }

  /**
   * Получить статистику по задачам
   */
  static async getTaskStatistics(): Promise<TaskStatistics> {
    const response = await apiClient.get<TaskStatistics>('/tasks/statistics');
    return response.data;
  }

  /**
   * Получить задачу по ID
   */
  static async getTask(taskId: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${taskId}`);
    return response.data;
  }

  /**
   * Обновить задачу
   */
  static async updateTask(taskId: string, data: UpdateTaskRequest): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${taskId}`, data);
    return response.data;
  }

  /**
   * Отметить задачу как выполненную
   */
  static async completeTask(taskId: string, evidenceDescription: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${taskId}/complete`, {
      evidenceDescription,
    });
    return response.data;
  }

  /**
   * Получить все планы действий
   */
  static async getActionPlans(): Promise<ActionPlan[]> {
    const response = await apiClient.get<unknown>('/action-plans');
    const body = response.data;
    if (!Array.isArray(body)) {
      console.warn('[TaskApi.getActionPlans] Ожидался массив, получено:', typeof body, body);
      return [];
    }
    return body.map((item) => coerceActionPlan(item as ActionPlanApiPayload));
  }

  /**
   * Получить план действий по ID
   */
  static async getActionPlan(planId: string): Promise<ActionPlan> {
    const response = await apiClient.get<unknown>(`/action-plans/${planId}`);
    return coerceActionPlan(response.data as ActionPlanApiPayload);
  }

  /**
   * POST /api/action-plans — создание плана или отправка полного списка задач (по контракту бэкенда)
   */
  static async postActionPlan(payload: CreateActionPlanApiRequest): Promise<ActionPlan> {
    const response = await apiClient.post<unknown>('/api/action-plans', payload);
    return coerceActionPlan(response.data as ActionPlanApiPayload);
  }

  /** Задачи текущего плана в теле POST /api/action-plans */
  static tasksForActionPlanPost(tasks: Task[]): CreateActionPlanApiRequest['tasks'] {
    return tasks.map((task) => ({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
    }));
  }

  /**
   * Создать план корректирующих действий
   */
  static async createActionPlan(data: CreateActionPlanRequest): Promise<ActionPlan> {
    return TaskApi.postActionPlan({
      caseId: data.caseId,
      title: data.title,
      description: data.description,
      tasks: data.tasks.map((task) => ({
        title: task.title,
        description: task.description,
        priority: task.priority,
        dueDate: task.dueDate,
      })),
    });
  }

  /**
   * Обновить план действий
   */
  static async updateActionPlan(planId: string, data: UpdateActionPlanRequest): Promise<ActionPlan> {
    const response = await apiClient.patch<unknown>(`/api/action-plans/${planId}`, data);
    return coerceActionPlan(response.data as ActionPlanApiPayload);
  }

  /**
   * Удалить план действий
   */
  static async deleteActionPlan(planId: string): Promise<void> {
    await apiClient.delete(`/api/action-plans/${planId}`);
  }

  /**
   * Отправить план на утверждение (POST /api/action-plans/{planId}/submit)
   */
  static async submitForVerification(planId: string): Promise<SubmitActionPlanResponse> {
    const response = await apiClient.post<SubmitActionPlanResponse>(
      `/api/action-plans/${planId}/submit`
    );
    return response.data;
  }

  /**
   * Загрузить доказательство выполнения задачи
   */
  static async uploadTaskEvidence(taskId: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('file', file);
    await apiClient.post(`/tasks/${taskId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
}
