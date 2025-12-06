// src/shared/lib/api/caseApi.ts

import { apiClient } from './apiClient';
import type {
  Case,
  CaseComment,
  CaseAttachment,
  CreateCaseRequest,
  UpdateCaseRequest,
  CaseStatistics,
  CaseVerificationDetails,
  VerificationDecision,
} from '@shared/types/caseTypes';

export class CaseApi {
  /**
   * Получить все случаи текущего пользователя
   */
  static async getMyCases(): Promise<Case[]> {
    const response = await apiClient.get<Case[]>('/cases/my');
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
