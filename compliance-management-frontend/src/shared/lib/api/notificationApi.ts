// src/shared/lib/api/notificationApi.ts

import { apiClient } from './apiClient';
import type {
  Notification,
  NotificationSettings,
  NotificationStats,
  MarkNotificationsRequest,
} from '@shared/types/notificationTypes';

export class NotificationApi {
  /**
   * Получить все уведомления
   */
  static async getNotifications(params?: {
    isRead?: boolean;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/notifications', { params });
    return response.data;
  }

  /**
   * Получить статистику уведомлений
   */
  static async getStats(): Promise<NotificationStats> {
    const response = await apiClient.get<NotificationStats>('/notifications/stats');
    return response.data;
  }

  /**
   * Пометить уведомления как прочитанные/архивированные
   */
  static async markNotifications(data: MarkNotificationsRequest): Promise<void> {
    await apiClient.put('/notifications/mark', data);
  }

  /**
   * Пометить все как прочитанные
   */
  static async markAllAsRead(): Promise<void> {
    await apiClient.put('/notifications/mark-all-read');
  }

  /**
   * Удалить уведомление
   */
  static async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  }

  /**
   * Удалить все прочитанные уведомления
   */
  static async deleteAllRead(): Promise<void> {
    await apiClient.delete('/notifications/read');
  }

  /**
   * Получить настройки уведомлений
   */
  static async getSettings(): Promise<NotificationSettings> {
    const response = await apiClient.get<NotificationSettings>('/notifications/settings');
    return response.data;
  }

  /**
   * Обновить настройки уведомлений
   */
  static async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    const response = await apiClient.put<NotificationSettings>('/notifications/settings', settings);
    return response.data;
  }
}
