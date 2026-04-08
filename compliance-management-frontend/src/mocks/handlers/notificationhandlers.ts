// src/mocks/handlers_notifications.ts

import { http, HttpResponse, delay } from 'msw';
import type {
  Notification,
  NotificationSettings,
  NotificationStats,
  MarkNotificationsRequest,
  NotificationCategory,
  NotificationPriority,
} from '@shared/types/notificationTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Моковые уведомления
let mockNotifications: Notification[] = [
  {
    id: 'NOTIF-001',
    type: 'TASK_ASSIGNED',
    category: 'TASK',
    priority: 'HIGH',
    title: 'Новая задача назначена',
    message: 'Вам назначена задача "Проверить документы по случаю №2024-045"',
    metadata: {
      taskId: 'TASK-234',
      caseId: 'CASE-045',
    },
    link: '/employee/tasks',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 минут назад
    senderId: '3',
    senderName: 'Иван Иванов',
    relatedEntityType: 'TASK',
    relatedEntityId: 'TASK-234',
  },
  {
    id: 'NOTIF-002',
    type: 'CASE_STATUS_CHANGED',
    category: 'CASE',
    priority: 'MEDIUM',
    title: 'Изменен статус случая',
    message: 'Случай №2024-034 перешел в статус "На проверке"',
    metadata: {
      caseId: 'CASE-034',
      oldStatus: 'IN_PROGRESS',
      newStatus: 'UNDER_REVIEW',
    },
    link: '/manager/cases/CASE-034',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 минут назад
    senderId: '5',
    senderName: 'Мария Сидорова',
    relatedEntityType: 'CASE',
    relatedEntityId: 'CASE-034',
  },
  {
    id: 'NOTIF-003',
    type: 'INCIDENT_CRITICAL',
    category: 'INCIDENT',
    priority: 'URGENT',
    title: 'Критичный инцидент',
    message: 'Обнаружено превышение бюджета на 25% в закупке №PUR-2024-567',
    metadata: {
      incidentId: 'INC-2024-089',
      severity: 'CRITICAL',
      amount: 5600000,
    },
    link: '/supervisor/incidents/INC-2024-089',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 часа назад
    senderId: 'SYSTEM',
    senderName: 'Система',
    relatedEntityType: 'INCIDENT',
    relatedEntityId: 'INC-2024-089',
  },
  {
    id: 'NOTIF-004',
    type: 'TASK_DEADLINE_APPROACHING',
    category: 'TASK',
    priority: 'MEDIUM',
    title: 'Приближается срок задачи',
    message: 'До завершения задачи "Анализ контрагента" осталось менее 24 часов',
    metadata: {
      taskId: 'TASK-189',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    },
    link: '/employee/tasks',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 часа назад
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    senderId: 'SYSTEM',
    senderName: 'Система',
    relatedEntityType: 'TASK',
    relatedEntityId: 'TASK-189',
  },
  {
    id: 'NOTIF-005',
    type: 'CASE_COMMENT_ADDED',
    category: 'CASE',
    priority: 'LOW',
    title: 'Новый комментарий',
    message: 'Петр Петров оставил комментарий в случае №2024-045',
    metadata: {
      caseId: 'CASE-045',
      commentId: 'COMMENT-567',
    },
    link: '/employee/cases/CASE-045',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 часов назад
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    senderId: '4',
    senderName: 'Петр Петров',
    relatedEntityType: 'CASE',
    relatedEntityId: 'CASE-045',
  },
  {
    id: 'NOTIF-006',
    type: 'APPROVAL_REQUEST',
    category: 'APPROVAL',
    priority: 'HIGH',
    title: 'Требуется согласование',
    message: 'Запрос на согласование закупки на сумму 1 200 000 ₽',
    metadata: {
      requestId: 'APPR-234',
      amount: 1200000,
    },
    link: '/manager/approvals',
    actionLabel: 'Рассмотреть',
    actionUrl: '/manager/approvals/APPR-234',
    isRead: false,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 часов назад
    senderId: '7',
    senderName: 'Алексей Смирнов',
    relatedEntityType: 'CASE',
    relatedEntityId: 'APPR-234',
  },
  {
    id: 'NOTIF-007',
    type: 'RULE_TRIGGERED',
    category: 'SYSTEM',
    priority: 'MEDIUM',
    title: 'Сработало правило',
    message: 'Правило "Конфликт интересов" выявило потенциальное нарушение',
    metadata: {
      ruleId: 'RULE-001',
      ruleName: 'Конфликт интересов при закупках',
    },
    link: '/supervisor/rules',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 день назад
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    senderId: 'SYSTEM',
    senderName: 'Система',
    relatedEntityType: 'RULE',
    relatedEntityId: 'RULE-001',
  },
  {
    id: 'NOTIF-008',
    type: 'REPORT_READY',
    category: 'REPORT',
    priority: 'LOW',
    title: 'Отчет готов',
    message: 'Ежемесячный отчет по аналитике за ноябрь 2024 сформирован',
    metadata: {
      reportId: 'REPORT-1124',
      period: 'Ноябрь 2024',
    },
    link: '/supervisor/reports',
    actionLabel: 'Скачать',
    actionUrl: '/supervisor/reports/REPORT-1124/download',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 дня назад
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
    senderId: 'SYSTEM',
    senderName: 'Система',
  },
  {
    id: 'NOTIF-009',
    type: 'TASK_COMPLETED',
    category: 'TASK',
    priority: 'LOW',
    title: 'Задача выполнена',
    message: 'Ольга Кузнецова завершила задачу "Проверка документации"',
    metadata: {
      taskId: 'TASK-178',
      completedBy: 'USER-7',
    },
    link: '/manager/tasks',
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 дня назад
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
    senderId: '7',
    senderName: 'Ольга Кузнецова',
    relatedEntityType: 'TASK',
    relatedEntityId: 'TASK-178',
  },
  {
    id: 'NOTIF-010',
    type: 'SYSTEM_UPDATE',
    category: 'SYSTEM',
    priority: 'LOW',
    title: 'Обновление системы',
    message: 'Система будет обновлена сегодня в 22:00. Ожидаемое время простоя: 30 минут',
    metadata: {
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      duration: 30,
    },
    isRead: true,
    isArchived: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 дня назад
    readAt: new Date(Date.now() - 1000 * 60 * 60 * 95).toISOString(),
    senderId: 'SYSTEM',
    senderName: 'Администратор',
  },
];

// Моковые настройки уведомлений
const mockSettings: NotificationSettings = {
  userId: '1',
  enabled: true,
  soundEnabled: true,
  desktopEnabled: true,
  
  categories: {
    TASK: {
      enabled: true,
      email: true,
      push: true,
      inApp: true,
    },
    CASE: {
      enabled: true,
      email: true,
      push: true,
      inApp: true,
    },
    INCIDENT: {
      enabled: true,
      email: true,
      push: true,
      inApp: true,
    },
    SYSTEM: {
      enabled: true,
      email: false,
      push: false,
      inApp: true,
    },
    APPROVAL: {
      enabled: true,
      email: true,
      push: true,
      inApp: true,
    },
    SOCIAL: {
      enabled: true,
      email: false,
      push: true,
      inApp: true,
    },
    REPORT: {
      enabled: true,
      email: true,
      push: false,
      inApp: true,
    },
  },
  
  priorities: {
    LOW: {
      enabled: true,
      sound: false,
      desktop: false,
    },
    MEDIUM: {
      enabled: true,
      sound: true,
      desktop: false,
    },
    HIGH: {
      enabled: true,
      sound: true,
      desktop: true,
    },
    URGENT: {
      enabled: true,
      sound: true,
      desktop: true,
    },
  },
  
  doNotDisturb: {
    enabled: false,
  },
};

// Вычисление статистики
const calculateStats = (): NotificationStats => {
  const unread = mockNotifications.filter(n => !n.isRead).length;
  
  const byCategory: NotificationStats['byCategory'] = [];
  const categories: NotificationCategory[] = ['TASK', 'CASE', 'INCIDENT', 'SYSTEM', 'APPROVAL', 'SOCIAL', 'REPORT'];
  
  categories.forEach(category => {
    const categoryNotifications = mockNotifications.filter(n => n.category === category);
    byCategory.push({
      category,
      count: categoryNotifications.length,
      unreadCount: categoryNotifications.filter(n => !n.isRead).length,
    });
  });
  
  const byPriority: NotificationStats['byPriority'] = [];
  const priorities: NotificationPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  
  priorities.forEach(priority => {
    const count = mockNotifications.filter(n => n.priority === priority).length;
    byPriority.push({ priority, count });
  });
  
  return {
    total: mockNotifications.length,
    unread,
    byCategory,
    byPriority,
  };
};

export const notificationHandlers = [
  // GET /notifications - Получить уведомления
  http.get(`${API_BASE_URL}/notifications`, async ({ request }) => {
    await delay(500);
    
    const url = new URL(request.url);
    const isRead = url.searchParams.get('isRead');
    const category = url.searchParams.get('category');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    
    console.log('🔔 [MSW] Fetching notifications');
    
    let filtered = mockNotifications;
    
    if (isRead !== null) {
      filtered = filtered.filter(n => n.isRead === (isRead === 'true'));
    }
    
    if (category) {
      filtered = filtered.filter(n => n.category === category);
    }
    
    const paginated = filtered.slice(offset, offset + limit);
    
    return HttpResponse.json(paginated);
  }),

  // GET /notifications/stats - Получить статистику
  http.get(`${API_BASE_URL}/notifications/stats`, async () => {
    await delay(300);
    console.log('📊 [MSW] Fetching notification stats');
    
    const stats = calculateStats();
    return HttpResponse.json(stats);
  }),

  // PUT /notifications/mark - Пометить уведомления
  http.put(`${API_BASE_URL}/notifications/mark`, async ({ request }) => {
    await delay(400);
    const data = await request.json() as MarkNotificationsRequest;
    console.log('✅ [MSW] Marking notifications:', data);
    
    data.notificationIds.forEach(id => {
      const notification = mockNotifications.find(n => n.id === id);
      if (notification) {
        if (data.isRead !== undefined) {
          notification.isRead = data.isRead;
          notification.readAt = data.isRead ? new Date().toISOString() : undefined;
        }
        if (data.isArchived !== undefined) {
          notification.isArchived = data.isArchived;
        }
      }
    });
    
    return HttpResponse.json({ message: 'Notifications marked successfully' });
  }),

  // PUT /notifications/mark-all-read - Пометить все как прочитанные
  http.put(`${API_BASE_URL}/notifications/mark-all-read`, async () => {
    await delay(500);
    console.log('✅ [MSW] Marking all notifications as read');
    
    mockNotifications.forEach(n => {
      if (!n.isRead) {
        n.isRead = true;
        n.readAt = new Date().toISOString();
      }
    });
    
    return HttpResponse.json({ message: 'All notifications marked as read' });
  }),

  // DELETE /notifications/:notificationId - Удалить уведомление
  http.delete(`${API_BASE_URL}/notifications/:notificationId`, async ({ params }) => {
    await delay(400);
    const { notificationId } = params;
    console.log(`🗑️ [MSW] Deleting notification: ${notificationId}`);
    
    const index = mockNotifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      mockNotifications.splice(index, 1);
    }
    
    return HttpResponse.json({ message: 'Notification deleted' });
  }),

  // DELETE /notifications/read - Удалить все прочитанные
  http.delete(`${API_BASE_URL}/notifications/read`, async () => {
    await delay(500);
    console.log('🗑️ [MSW] Deleting all read notifications');
    
    mockNotifications = mockNotifications.filter(n => !n.isRead);
    
    return HttpResponse.json({ message: 'Read notifications deleted' });
  }),

  // GET /notifications/settings - Получить настройки
  http.get(`${API_BASE_URL}/notifications/settings`, async () => {
    await delay(400);
    console.log('⚙️ [MSW] Fetching notification settings');
    
    return HttpResponse.json(mockSettings);
  }),

  // PUT /notifications/settings - Обновить настройки
  http.put(`${API_BASE_URL}/notifications/settings`, async ({ request }) => {
    await delay(500);
    const updates = await request.json() as Partial<NotificationSettings>;
    console.log('⚙️ [MSW] Updating notification settings:', updates);
    
    Object.assign(mockSettings, updates);
    
    return HttpResponse.json(mockSettings);
  }),
];
