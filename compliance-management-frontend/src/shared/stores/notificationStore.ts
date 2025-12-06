// src/shared/stores/notificationStore.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { NotificationApi } from '@shared/lib/api/notificationApi';
import { NotificationWebSocket } from '@shared/lib/websocket/notificationWebSocket';
import type {
  Notification,
  NotificationSettings,
  NotificationStats,
} from '@shared/types/notificationTypes';

export class NotificationStore {
  notifications: Notification[] = [];
  stats: NotificationStats | null = null;
  settings: NotificationSettings | null = null;
  loading = false;
  webSocket: NotificationWebSocket | null = null;
  isConnected = false;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Инициализация (загрузка данных и подключение к WebSocket)
   */
  async initialize(authToken: string): Promise<void> {
    try {
      this.loading = true;

      // Загрузить уведомления и статистику
      const [notifications, stats, settings] = await Promise.all([
        NotificationApi.getNotifications({ limit: 50 }),
        NotificationApi.getStats(),
        NotificationApi.getSettings(),
      ]);

      runInAction(() => {
        this.notifications = notifications;
        this.stats = stats;
        this.settings = settings;
      });

      // Подключиться к WebSocket
      await this.connectWebSocket(authToken);
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  /**
   * Подключение к WebSocket
   */
  async connectWebSocket(authToken: string): Promise<void> {
    try {
      this.webSocket = new NotificationWebSocket(authToken);

      this.webSocket.on('connected', () => {
        runInAction(() => {
          this.isConnected = true;
        });
      });

      this.webSocket.on('disconnected', () => {
        runInAction(() => {
          this.isConnected = false;
        });
      });

      this.webSocket.on('notification', (notification: Notification) => {
        this.handleNewNotification(notification);
      });

      this.webSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      await this.webSocket.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  /**
   * Отключение от WebSocket
   */
  disconnectWebSocket(): void {
    if (this.webSocket) {
      this.webSocket.disconnect();
      this.webSocket = null;
    }
    this.isConnected = false;
  }

  /**
   * Обработка нового уведомления
   */
  private handleNewNotification(notification: Notification): void {
    runInAction(() => {
      // Добавить в начало списка
      this.notifications.unshift(notification);

      // Обновить статистику
      if (this.stats) {
        this.stats.total += 1;
        this.stats.unread += 1;

        // Обновить по категориям
        const categoryStats = this.stats.byCategory.find(c => c.category === notification.category);
        if (categoryStats) {
          categoryStats.count += 1;
          categoryStats.unreadCount += 1;
        }

        // Обновить по приоритетам
        const priorityStats = this.stats.byPriority.find(p => p.priority === notification.priority);
        if (priorityStats) {
          priorityStats.count += 1;
        }
      }
    });

    // Показать desktop уведомление, если включено
    if (this.settings?.desktopEnabled && this.shouldShowNotification(notification)) {
      this.showDesktopNotification(notification);
    }
  }

  /**
   * Пометить уведомление как прочитанное
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await NotificationApi.markNotifications({
        notificationIds: [notificationId],
        isRead: true,
      });

      runInAction(() => {
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          notification.readAt = new Date().toISOString();

          // Обновить статистику
          if (this.stats) {
            this.stats.unread = Math.max(0, this.stats.unread - 1);
            const categoryStats = this.stats.byCategory.find(c => c.category === notification.category);
            if (categoryStats) {
              categoryStats.unreadCount = Math.max(0, categoryStats.unreadCount - 1);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Пометить все как прочитанные
   */
  async markAllAsRead(): Promise<void> {
    try {
      await NotificationApi.markAllAsRead();

      runInAction(() => {
        this.notifications.forEach(n => {
          if (!n.isRead) {
            n.isRead = true;
            n.readAt = new Date().toISOString();
          }
        });

        if (this.stats) {
          this.stats.unread = 0;
          this.stats.byCategory.forEach(c => {
            c.unreadCount = 0;
          });
        }
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  /**
   * Удалить уведомление
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await NotificationApi.deleteNotification(notificationId);

      runInAction(() => {
        const index = this.notifications.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          const notification = this.notifications[index];
          this.notifications.splice(index, 1);

          // Обновить статистику
          if (this.stats) {
            this.stats.total = Math.max(0, this.stats.total - 1);
            if (!notification.isRead) {
              this.stats.unread = Math.max(0, this.stats.unread - 1);
            }

            const categoryStats = this.stats.byCategory.find(c => c.category === notification.category);
            if (categoryStats) {
              categoryStats.count = Math.max(0, categoryStats.count - 1);
              if (!notification.isRead) {
                categoryStats.unreadCount = Math.max(0, categoryStats.unreadCount - 1);
              }
            }

            const priorityStats = this.stats.byPriority.find(p => p.priority === notification.priority);
            if (priorityStats) {
              priorityStats.count = Math.max(0, priorityStats.count - 1);
            }
          }
        }
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }

  /**
   * Удалить все прочитанные уведомления
   */
  async deleteAllRead(): Promise<void> {
    try {
      await NotificationApi.deleteAllRead();

      runInAction(() => {
        const readCount = this.notifications.filter(n => n.isRead).length;
        this.notifications = this.notifications.filter(n => !n.isRead);

        if (this.stats) {
          this.stats.total = Math.max(0, this.stats.total - readCount);
        }
      });
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  }

  /**
   * Обновить настройки
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const updated = await NotificationApi.updateSettings(settings);
      runInAction(() => {
        this.settings = updated;
      });
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }

  /**
   * Получить количество непрочитанных уведомлений
   */
  get unreadCount(): number {
    return this.stats?.unread || 0;
  }

  /**
   * Получить непрочитанные уведомления
   */
  get unreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  /**
   * Проверить, нужно ли показывать уведомление
   */
  private shouldShowNotification(notification: Notification): boolean {
    if (!this.settings) return false;

    // Проверить режим "Не беспокоить"
    if (this.settings.doNotDisturb.enabled) {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const currentDay = now.getDay();

      const { startTime, endTime, days } = this.settings.doNotDisturb;

      if (days && !days.includes(currentDay)) {
        return false;
      }

      if (startTime && endTime && currentTime >= startTime && currentTime <= endTime) {
        return false;
      }
    }

    // Проверить настройки категории
    const categorySettings = this.settings.categories[notification.category];
    if (!categorySettings?.enabled || !categorySettings?.inApp) {
      return false;
    }

    return true;
  }


  /**
   * Показать desktop уведомление
   */
  private showDesktopNotification(notification: Notification): void {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: notification.id,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          this.showDesktopNotification(notification);
        }
      });
    }
  }

  /**
   * Очистка при выходе
   */
  cleanup(): void {
    this.disconnectWebSocket();
    this.notifications = [];
    this.stats = null;
    this.settings = null;
  }
}

// Создать экземпляр store
export const notificationStore = new NotificationStore();
