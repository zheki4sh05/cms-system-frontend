// src/shared/lib/api/dashboardApi.ts

import { apiClient } from './apiClient';
import type { DashboardStats, RecentActivity, UpcomingTask } from '@shared/types/dashBoardTypes';

export class DashboardApi {
  /**
   * Получить статистику для менеджера
   */
  static async getManagerStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/manager/stats');
    return response.data;
  }

  /**
   * Получить последние активности
   */
  static async getRecentActivities(): Promise<RecentActivity[]> {
    const response = await apiClient.get<RecentActivity[]>('/dashboard/manager/activities');
    return response.data;
  }

  /**
   * Получить предстоящие задачи
   */
  static async getUpcomingTasks(): Promise<UpcomingTask[]> {
    const response = await apiClient.get<UpcomingTask[]>('/dashboard/manager/tasks');
    return response.data;
  }

  /**
   * Получить статистику для руководителя
   */
  static async getSupervisorStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/supervisor/stats');
    return response.data;
  }

  /**
   * Получить статистику для топ-менеджмента
   */
  static async getExecutiveStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/dashboard/executive/stats');
    return response.data;
  }
}
