// src/shared/lib/api/caseApi.ts

import { apiClient } from './apiClient';
import type {
  Case,
  CaseComment,
  CaseAttachment,
  CreateCaseRequest,
  UpdateCaseRequest,
  UpdateInvestigationRequest,
  CaseStatistics,
  CaseVerificationDetails,
  VerificationDecision,
  CaseViewItem,
} from '@shared/types/caseTypes';

interface MyCaseDto {
  id?: unknown;
  caseId?: unknown;
  ruleId?: unknown;
  ruleName?: unknown;
  priority?: string;
  status?: string;
  deadline?: string | null;
}

interface CaseCommentApiResponse {
  id: string;
  caseId: string;
  userId?: string;
  userName?: string;
  comment?: unknown;
  content?: unknown;
  time?: string;
}

export class CaseApi {
  private static stringifyUnknown(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  /** Нормализует JSON, когда список приходит массивом или обёрнут в объект (Spring Page и т.п.). */
  private static unwrapArrayPayload(raw: unknown): unknown[] {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.content)) return o.content;
      if (Array.isArray(o.data)) return o.data;
      if (Array.isArray(o.comments)) return o.comments;
      if (Array.isArray(o.items)) return o.items;
      if (Array.isArray(o.attachments)) return o.attachments;
    }
    return [];
  }

  private static normalizeStatus(status: string | undefined): Case['status'] {
    const normalized = (status || '').toUpperCase();
    const statusMap: Record<string, Case['status']> = {
      OPEN: 'OPEN',
      ASSIGNED: 'ASSIGNED',
      IN_PROGRESS: 'IN_PROGRESS',
      INVESTIGATING: 'INVESTIGATING',
      ACTION_PLAN: 'ACTION_PLAN',
      ACTION_IN_PROGRESS: 'ACTION_IN_PROGRESS',
      WAITING_VERIFICATION: 'WAITING_VERIFICATION',
      CLOSED: 'CLOSED',
      REJECTED: 'REJECTED',
      ESCALATED_TO_CASE: 'ESCALATED_TO_CASE',
    };
    return statusMap[normalized] || 'OPEN';
  }

  private static normalizePriority(priority: string | undefined): Case['priority'] {
    const normalized = (priority || '').toUpperCase();
    const priorityMap: Record<string, Case['priority']> = {
      LOW: 'LOW',
      NORMAL: 'NORMAL',
      MEDIUM: 'NORMAL',
      HIGH: 'HIGH',
      URGENT: 'URGENT',
      CRITICAL: 'URGENT',
    };
    return priorityMap[normalized] || 'NORMAL';
  }

  private static normalizeMyCase(dto: MyCaseDto): Case {
    const now = new Date().toISOString();
    const caseId =
      this.stringifyUnknown(dto.caseId) ||
      this.stringifyUnknown(dto.id) ||
      this.stringifyUnknown(dto.ruleId) ||
      crypto.randomUUID();
    const ruleId = this.stringifyUnknown(dto.ruleId) || caseId;
    const ruleName = this.stringifyUnknown(dto.ruleName) || 'Без названия';
    const normalizedStatus = this.normalizeStatus(dto.status);
    const normalizedPriority = this.normalizePriority(dto.priority);

    return {
      id: caseId,
      caseId,
      ruleId,
      title: ruleName,
      description: '',
      status: normalizedStatus,
      severity: 'MEDIUM',
      priority: normalizedPriority,
      ownerId: '',
      ownerName: '',
      createdAt: now,
      updatedAt: now,
      dueDate: dto.deadline || undefined,
      incidentIds: [],
      tags: [],
      requiresCorrectiveAction: false,
    };
  }

  /**
   * Получить все случаи текущего пользователя
   */
  static async getMyCases(): Promise<Case[]> {
    const response = await apiClient.get<MyCaseDto[]>('/cases/my');
    return response.data.map((item) => this.normalizeMyCase(item));
  }

  /**
   * Получить данные для карточки просмотра случаев
   */
  static async getCaseView(caseId: string): Promise<CaseViewItem> {
    const response = await apiClient.get<CaseViewItem>(`/cases/${caseId}/view`);
    return response.data;
  }

  /**
   * Получить данные просмотра случая из case-service (порт 8081)
   */
  static async getCaseViewFromCasesService(caseId: string): Promise<CaseViewItem> {
    const response = await apiClient.get<CaseViewItem>(
      `http://localhost:8081/api/v1/cases/${encodeURIComponent(caseId)}/view`
    );
    return response.data;
  }

  /**
   * Получить статистику по случаям
   */
  static async getCaseStatistics(): Promise<CaseStatistics> {
    const response = await apiClient.get<CaseStatistics>('/cases/statistics');
    return response.data;
  }

  /**
   * Получить случай по ID
   */
  static async getCase(caseId: string): Promise<Case> {
    const response = await apiClient.get<Case>(`/cases/${caseId}`);
    return response.data;
  }

  /**
   * Создать новый случай
   */
  static async createCase(data: CreateCaseRequest): Promise<Case> {
    const response = await apiClient.post<Case>('/cases', data);
    return response.data;
  }

  /**
   * Обновить случай
   */
  static async updateCase(caseId: string, data: UpdateCaseRequest): Promise<Case> {
    const response = await apiClient.patch<Case>(`/cases/${caseId}`, data);
    return response.data;
  }

  /**
   * Обновить расследование случая
   */
  static async updateInvestigation(
    caseId: string,
    data: UpdateInvestigationRequest
  ): Promise<Case> {
    const response = await apiClient.patch<Case>(`/api/cases/${caseId}/investigation`, data);
    return response.data;
  }

  /**
   * Закрыть случай
   */
  static async closeCase(caseId: string, conclusion: string): Promise<Case> {
    const response = await apiClient.post<Case>(`/cases/${caseId}/close`, { conclusion });
    return response.data;
  }

  /**
   * Получить комментарии к случаю
   */
  static async getCaseComments(caseId: string): Promise<CaseComment[]> {
    const response = await apiClient.get<unknown>(`/cases/${caseId}/comments`);
    const list = this.unwrapArrayPayload(response.data);
    return list.map((item) => this.normalizeCaseComment(item));
  }

  /**
   * Добавить комментарий к случаю
   */
  static async addCaseComment(caseId: string, content: string): Promise<CaseComment> {
    const response = await apiClient.post<CaseCommentApiResponse>(
      `/cases/${caseId}/comments`,
      { content }
    );
    const data = response.data;
    return this.normalizeCaseComment(data);
  }

  private static normalizeCaseComment(raw: unknown): CaseComment {
    if (!raw || typeof raw !== 'object') {
      return {
        id: '',
        caseId: '',
        authorId: '',
        authorName: 'Неизвестный автор',
        content: '',
        createdAt: new Date().toISOString(),
      };
    }

    const dto = raw as Partial<CaseCommentApiResponse> & Partial<CaseComment>;

    const pickText = (value: unknown): string => {
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      return '';
    };

    const commentText = pickText(dto.comment);
    const contentText = pickText(dto.content);
    const timeText = typeof dto.time === 'string' ? dto.time : '';

    const hasBackendAuthor =
      typeof dto.userId === 'string' ||
      typeof dto.userName === 'string';

    const isApiShape =
      Boolean(timeText) &&
      (commentText.length > 0 || contentText.length > 0) &&
      hasBackendAuthor;

    if (isApiShape) {
      const authorName =
        typeof dto.userName === 'string' && dto.userName.trim().length > 0
          ? dto.userName.trim()
          : 'Неизвестный автор';

      const text = commentText.length > 0 ? commentText : contentText;

      return {
        id: typeof dto.id === 'string' ? dto.id : '',
        caseId: typeof dto.caseId === 'string' ? dto.caseId : '',
        authorId: typeof dto.userId === 'string' ? dto.userId : '',
        authorName,
        content: text,
        createdAt: timeText || new Date().toISOString(),
      };
    }

    const legacy = dto;
    return {
      id: legacy.id ?? '',
      caseId: legacy.caseId ?? '',
      authorId: legacy.authorId ?? '',
      authorName: legacy.authorName?.trim() ? legacy.authorName : 'Неизвестный автор',
      content: legacy.content ?? '',
      createdAt: legacy.createdAt ?? new Date().toISOString(),
      attachments: legacy.attachments,
    };
  }

  private static readonly attachmentApiBase =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

  /**
   * Восстанавливает UTF-8 имя файла, если бэкенд отдал строку как ISO-8859-1 (типичный mojibake).
   */
  private static tryDecodeUtf8FilenameFromLatin1Bytes(s: string): string {
    if (!s) return s;
    try {
      const bytes = new Uint8Array(s.length);
      for (let i = 0; i < s.length; i++) {
        bytes[i] = s.charCodeAt(i) & 0xff;
      }
      return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    } catch {
      return s;
    }
  }

  private static fileTypeFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    const map: Record<string, string> = {
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
    };
    return map[ext] || 'application/octet-stream';
  }

  /**
   * Приводит ответ API вложения к CaseAttachment.
   * Поддерживает полный объект фронта и ответ бэкенда: id, caseId, userId, fileId, name, time.
   */
  private static normalizeCaseAttachmentRecord(
    raw: unknown,
    fallbackCaseId: string,
    sourceFile?: File
  ): CaseAttachment {
    if (!raw || typeof raw !== 'object') {
      return {
        id: '',
        caseId: fallbackCaseId,
        fileName: sourceFile?.name ?? '',
        fileUrl: '',
        fileSize: sourceFile?.size ?? 0,
        fileType: sourceFile?.type || this.fileTypeFromFileName(sourceFile?.name ?? ''),
        uploadedBy: '',
        uploadedAt: new Date().toISOString(),
      };
    }

    const dto = raw as Record<string, unknown>;

    const legacyName = dto.fileName;
    const legacyUrl = dto.fileUrl;
    const legacyUploadedAt = dto.uploadedAt;

    if (
      typeof legacyName === 'string' &&
      legacyName.length > 0 &&
      typeof legacyUrl === 'string' &&
      typeof legacyUploadedAt === 'string'
    ) {
      return {
        id: this.stringifyUnknown(dto.id),
        caseId: this.stringifyUnknown(dto.caseId) || fallbackCaseId,
        fileName: legacyName,
        fileUrl: legacyUrl,
        fileSize:
          typeof dto.fileSize === 'number' ? dto.fileSize : (sourceFile?.size ?? 0),
        fileType:
          typeof dto.fileType === 'string' && dto.fileType
            ? dto.fileType
            : sourceFile?.type || this.fileTypeFromFileName(legacyName),
        uploadedBy: typeof dto.uploadedBy === 'string' ? dto.uploadedBy : '',
        uploadedAt: legacyUploadedAt,
      };
    }

    const id = this.stringifyUnknown(dto.id);
    const cid = this.stringifyUnknown(dto.caseId) || fallbackCaseId;
    const fileId = this.stringifyUnknown(dto.fileId);
    const serverName = typeof dto.name === 'string' ? dto.name : '';

    const displayName =
      sourceFile?.name?.trim().length
        ? sourceFile.name
        : serverName
          ? this.tryDecodeUtf8FilenameFromLatin1Bytes(serverName)
          : sourceFile?.name ?? 'file';

    const uploadedAt =
      typeof dto.time === 'string'
        ? dto.time
        : typeof dto.uploadedAt === 'string'
          ? dto.uploadedAt
          : new Date().toISOString();

    const uploadedBy = this.stringifyUnknown(dto.userId);

    let fileUrl = '';
    if (typeof dto.fileUrl === 'string' && dto.fileUrl.length > 0) {
      fileUrl = dto.fileUrl;
    } else if (fileId) {
      fileUrl = `${this.attachmentApiBase.replace(/\/$/, '')}/files/${encodeURIComponent(fileId)}`;
    }

    const fileSize =
      typeof dto.fileSize === 'number'
        ? dto.fileSize
        : sourceFile?.size ?? 0;

    const fileType =
      typeof dto.fileType === 'string' && dto.fileType
        ? dto.fileType
        : sourceFile?.type || this.fileTypeFromFileName(displayName);

    return {
      id,
      caseId: cid,
      fileName: displayName,
      fileUrl,
      fileSize,
      fileType,
      uploadedBy,
      uploadedAt,
    };
  }

  /**
   * Получить вложения случая
   */
  static async getCaseAttachments(caseId: string): Promise<CaseAttachment[]> {
    const response = await apiClient.get<unknown>(`/cases/${caseId}/attachments`);
    const list = this.unwrapArrayPayload(response.data);
    return list.map((item) => this.normalizeCaseAttachmentRecord(item, caseId));
  }

  /**
   * Загрузить вложение к случаю
   */
  static async uploadCaseAttachment(caseId: string, file: File): Promise<CaseAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<unknown>(
      `/cases/${caseId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return this.normalizeCaseAttachmentRecord(response.data, caseId, file);
  }

  private static parseFilenameFromContentDisposition(header: string | undefined): string | null {
    if (!header) return null;
    const utf8Match = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
    if (utf8Match?.[1]) {
      try {
        return decodeURIComponent(utf8Match[1].trim());
      } catch {
        /* ignore */
      }
    }
    const quoted = /filename="([^"]+)"/i.exec(header);
    if (quoted?.[1]) return quoted[1];
    const plain = /filename=([^;\s]+)/i.exec(header);
    if (plain?.[1]) return plain[1].replace(/^"|"$/g, '');
    return null;
  }

  /**
   * Скачать файл вложения (GET с авторизацией, сохранение через blob).
   */
  static async downloadCaseAttachment(
    caseId: string,
    attachmentId: string,
    fallbackFileName: string
  ): Promise<void> {
    const path = `/api/cases/${encodeURIComponent(caseId)}/attachments/${encodeURIComponent(attachmentId)}/download`;
    const response = await apiClient.get<Blob>(path, {
      responseType: 'blob',
    });

    const cd =
      typeof response.headers['content-disposition'] === 'string'
        ? response.headers['content-disposition']
        : undefined;
    const fileName =
      this.parseFilenameFromContentDisposition(cd) || fallbackFileName || 'download';

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      window.URL.revokeObjectURL(url);
    }
  }

  /**
   * Удалить вложение случая
   */
  static async deleteCaseAttachment(caseId: string, attachmentId: string): Promise<void> {
    const path = `/api/cases/${encodeURIComponent(caseId)}/attachments/${encodeURIComponent(attachmentId)}`;
    await apiClient.delete(path);
  }

  /**
   * Получить детали для верификации случая (только для руководителя)
   */
  static async getCaseVerificationDetails(caseId: string): Promise<CaseVerificationDetails> {
    const response = await apiClient.get<CaseVerificationDetails>(
      `/cases/${caseId}/verification-details`
    );
    return response.data;
  }

  /**
   * Верифицировать случай (утвердить/отклонить)
   */
  static async verifyCase(caseId: string, decision: VerificationDecision): Promise<Case> {
    const response = await apiClient.post<Case>(
      `/cases/${caseId}/verify`,
      decision
    );
    return response.data;
  }

  /**
   * Получить историю верификаций
   */
  static async getVerificationHistory(caseId: string): Promise<any[]> {
    const response = await apiClient.get(`/cases/${caseId}/verification-history`);
    return response.data;
  }
}
