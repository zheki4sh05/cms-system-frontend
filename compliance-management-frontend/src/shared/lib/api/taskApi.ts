// src/shared/lib/api/taskApi.ts

import { apiClient } from './apiClient';
import type {
  Task,
  ActionPlan,
  CreateActionPlanRequest,
  UpdateTaskRequest,
  TaskStatistics,
} from '@shared/types/taskTypes';

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
    const response = await apiClient.get<ActionPlan[]>('/action-plans');
    return response.data;
  }

  /**
   * Получить план действий по ID
   */
  static async getActionPlan(planId: string): Promise<ActionPlan> {
    const response = await apiClient.get<ActionPlan>(`/action-plans/${planId}`);
    return response.data;
  }

  /**
   * Создать план корректирующих действий
   */
  static async createActionPlan(data: CreateActionPlanRequest): Promise<ActionPlan> {
    const response = await apiClient.post<ActionPlan>('/action-plans', data);
    return response.data;
  }

  /**
   * Отправить план на верификацию
   */
  static async submitForVerification(planId: string): Promise<ActionPlan> {
    const response = await apiClient.post<ActionPlan>(`/action-plans/${planId}/submit`);
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
