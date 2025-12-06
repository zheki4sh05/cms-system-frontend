// src/shared/types/notification.types.ts

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  
  title: string;
  message: string;
  
  // Дополнительные данные
  metadata?: Record<string, any>;
  
  // Ссылки и действия
  link?: string;
  actionLabel?: string;
  actionUrl?: string;
  
  // Статус
  isRead: boolean;
  isArchived: boolean;
  
  // Временные метки
  createdAt: string;
  readAt?: string;
  
  // Отправитель
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  
  // Связанные сущности
  relatedEntityType?: 'CASE' | 'INCIDENT' | 'TASK' | 'RULE' | 'USER';
  relatedEntityId?: string;
}

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'TASK_COMPLETED'
  | 'TASK_DEADLINE_APPROACHING'
  | 'TASK_OVERDUE'
  | 'CASE_ASSIGNED'
  | 'CASE_STATUS_CHANGED'
  | 'CASE_COMMENT_ADDED'
  | 'CASE_ESCALATED'
  | 'INCIDENT_CREATED'
  | 'INCIDENT_UPDATED'
  | 'INCIDENT_RESOLVED'
  | 'INCIDENT_CRITICAL'
  | 'RULE_TRIGGERED'
  | 'RULE_DISABLED'
  | 'APPROVAL_REQUEST'
  | 'APPROVAL_APPROVED'
  | 'APPROVAL_REJECTED'
  | 'SYSTEM_ALERT'
  | 'SYSTEM_UPDATE'
  | 'MENTION'
  | 'MESSAGE'
  | 'REPORT_READY'
  | 'DEADLINE_REMINDER';

export type NotificationCategory =
  | 'TASK'
  | 'CASE'
  | 'INCIDENT'
  | 'SYSTEM'
  | 'APPROVAL'
  | 'SOCIAL'
  | 'REPORT';

export type NotificationPriority =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'URGENT';

export interface NotificationSettings {
  userId: string;
  
  // Глобальные настройки
  enabled: boolean;
  soundEnabled: boolean;
  desktopEnabled: boolean;
  
  // По категориям
  categories: {
    [key in NotificationCategory]: {
      enabled: boolean;
      email: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  
  // По приоритету
  priorities: {
    [key in NotificationPriority]: {
      enabled: boolean;
      sound: boolean;
      desktop: boolean;
    };
  };
  
  // Режим "Не беспокоить"
  doNotDisturb: {
    enabled: boolean;
    startTime?: string; // HH:mm
    endTime?: string; // HH:mm
    days?: number[]; // 0-6 (Вс-Сб)
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  byCategory: {
    category: NotificationCategory;
    count: number;
    unreadCount: number;
  }[];
  byPriority: {
    priority: NotificationPriority;
    count: number;
  }[];
}

export interface MarkNotificationsRequest {
  notificationIds: string[];
  isRead?: boolean;
  isArchived?: boolean;
}

export interface WebSocketNotificationMessage {
  type: 'NOTIFICATION' | 'NOTIFICATION_READ' | 'NOTIFICATION_DELETED' | 'PING' | 'PONG';
  notification?: Notification;
  notificationId?: string;
  timestamp: number;
  id: string;
}
