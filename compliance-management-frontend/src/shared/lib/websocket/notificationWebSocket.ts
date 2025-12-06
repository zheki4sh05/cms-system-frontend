// src/shared/lib/websocket/notificationWebSocket.ts

import type { Notification, WebSocketNotificationMessage } from '@shared/types/notificationTypes';

export type NotificationWebSocketEventType =
  | 'connected'
  | 'disconnected'
  | 'notification'
  | 'error'
  | 'reconnecting';

export type NotificationWebSocketListener = (data?: any) => void;

export class NotificationWebSocket {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: number | null = null;
  private listeners: Map<NotificationWebSocketEventType, Set<NotificationWebSocketListener>> = new Map();
  private url: string;
  private authToken: string;

  constructor(authToken: string) {
    this.authToken = authToken;
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = import.meta.env.VITE_WS_URL || `${wsProtocol}//${window.location.host}`;
    this.url = `${wsHost}/ws/notifications?token=${authToken}`;
  }

  /**
   * Подключиться к WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log('🔌 [WebSocket] Connecting to notifications WebSocket...');
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('✅ [WebSocket] Connected successfully');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message: WebSocketNotificationMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ [WebSocket] Failed to parse message:', error);
          }
        };

        this.socket.onclose = (event) => {
          console.log(`🔌 [WebSocket] Connection closed: ${event.code} - ${event.reason}`);
          this.cleanup();
          this.emit('disconnected', event.reason);

          // Автоматическое переподключение, если закрытие не было преднамеренным
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect();
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ [WebSocket] Error:', error);
          this.emit('error', new Error('WebSocket connection error'));
          reject(new Error('WebSocket connection error'));
        };
      } catch (error) {
        console.error('❌ [WebSocket] Failed to create connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Отключиться от WebSocket
   */
  disconnect(): void {
    console.log('🔌 [WebSocket] Disconnecting...');
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
    }
    this.cleanup();
  }

  /**
   * Проверка состояния подключения
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Подписаться на события
   */
  on(event: NotificationWebSocketEventType, listener: NotificationWebSocketListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  /**
   * Отписаться от событий
   */
  off(event: NotificationWebSocketEventType, listener: NotificationWebSocketListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * Испустить событие
   */
  private emit(event: NotificationWebSocketEventType, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  /**
   * Обработка сообщений от сервера
   */
  private handleMessage(message: WebSocketNotificationMessage): void {
    console.log('📨 [WebSocket] Message received:', message.type);

    switch (message.type) {
      case 'NOTIFICATION':
        if (message.notification) {
          this.emit('notification', message.notification);
        }
        break;

      case 'NOTIFICATION_READ':
        // Уведомление прочитано на другом устройстве
        console.log('📖 [WebSocket] Notification marked as read:', message.notificationId);
        break;

      case 'NOTIFICATION_DELETED':
        // Уведомление удалено на другом устройстве
        console.log('🗑️ [WebSocket] Notification deleted:', message.notificationId);
        break;

      case 'PONG':
        // Ответ на heartbeat
        console.log('💓 [WebSocket] Heartbeat response received');
        break;

      default:
        console.warn('⚠️ [WebSocket] Unknown message type:', message.type);
    }
  }

  /**
   * Отправить сообщение
   */
  private send(message: WebSocketNotificationMessage): void {
    if (!this.isConnected()) {
      console.warn('⚠️ [WebSocket] Cannot send message: not connected');
      return;
    }

    try {
      this.socket!.send(JSON.stringify(message));
      console.log('📤 [WebSocket] Message sent:', message.type);
    } catch (error) {
      console.error('❌ [WebSocket] Failed to send message:', error);
    }
  }

  /**
   * Запустить heartbeat
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = window.setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'PING',
          timestamp: Date.now(),
          id: crypto.randomUUID(),
        });
      }
    }, 30000); // Каждые 30 секунд
  }

  /**
   * Остановить heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Попытка переподключения
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    console.log(`🔄 [WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
    this.emit('reconnecting', this.reconnectAttempts);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('❌ [WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Очистка ресурсов
   */
  private cleanup(): void {
    this.stopHeartbeat();
    this.socket = null;
  }
}
