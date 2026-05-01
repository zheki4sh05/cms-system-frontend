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

export class CaseApi {
  private static stringifyUnknown(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
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
    const response = await apiClient.get<CaseComment[]>(`/cases/${caseId}/comments`);
    return response.data;
  }

  /**
   * Добавить комментарий к случаю
   */
  static async addCaseComment(caseId: string, content: string): Promise<CaseComment> {
    const response = await apiClient.post<CaseComment>(`/cases/${caseId}/comments`, { content });
    return response.data;
  }

  /**
   * Получить вложения случая
   */
  static async getCaseAttachments(caseId: string): Promise<CaseAttachment[]> {
    const response = await apiClient.get<CaseAttachment[]>(`/cases/${caseId}/attachments`);
    return response.data;
  }

  /**
   * Загрузить вложение к случаю
   */
  static async uploadCaseAttachment(caseId: string, file: File): Promise<CaseAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<CaseAttachment>(
      `/cases/${caseId}/attachments`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
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
