// src/shared/lib/api/ruleApi.ts

import { apiClient } from './apiClient';
import type {
  Rule,
  RuleStatistics,
  RuleTriggerHistory,
  CreateRuleRequest,
  UpdateRuleRequest,
  TestRuleRequest,
  TestRuleResponse,
  ValidateScriptRequest,
  ValidateScriptResponse,
} from '@shared/types/rulesTypes';
import type { RuleShortInfo } from '@shared/types/incidentTypes';

export class RuleApi {
  private static getCompanyIdForHeader(): string | undefined {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        return undefined;
      }

      const user = JSON.parse(rawUser) as { companyId?: string };
      return user.companyId;
    } catch {
      return undefined;
    }
  }

  /**
   * Получить все правила
   */
  static async getAllRules(): Promise<Rule[]> {
    const response = await apiClient.get<Rule[]>('/rules');
    return response.data;
  }

  /**
   * Получить статистику правил
   */
  static async getRuleStatistics(): Promise<RuleStatistics> {
    const response = await apiClient.get<RuleStatistics>('/rules/statistics');
    return response.data;
  }

  /**
   * Получить правило по ID
   */
  static async getRuleById(ruleId: string): Promise<Rule> {
    const response = await apiClient.get<Rule>(`/rules/${ruleId}`);
    return response.data;
  }

  /**
   * Получить короткую информацию о правиле
   */
  static async getRuleShort(ruleId: string): Promise<RuleShortInfo> {
    const companyId = this.getCompanyIdForHeader();
    const response = await apiClient.get<RuleShortInfo>(`/api/rules/short/${ruleId}`, {
      headers: companyId ? { CompanyId: companyId } : undefined,
    });
    return response.data;
  }

  /**
   * Создать новое правило
   */
  static async createRule(data: CreateRuleRequest): Promise<Rule> {
    const response = await apiClient.post<Rule>('/rules', data);
    return response.data;
  }

  /**
   * Обновить правило
   */
  static async updateRule(ruleId: string, data: UpdateRuleRequest): Promise<Rule> {
    const response = await apiClient.put<Rule>(`/rules/${ruleId}`, data);
    return response.data;
  }

  /**
   * Удалить правило
   */
  static async deleteRule(ruleId: string): Promise<void> {
    await apiClient.delete(`/rules/${ruleId}`);
  }

  /**
   * Активировать правило
   */
  static async activateRule(ruleId: string): Promise<Rule> {
    const response = await apiClient.post<Rule>(`/rules/${ruleId}/activate`);
    return response.data;
  }

  /**
   * Деактивировать правило
   */
  static async deactivateRule(ruleId: string): Promise<Rule> {
    const response = await apiClient.post<Rule>(`/rules/${ruleId}/deactivate`);
    return response.data;
  }

  /**
   * Получить историю срабатываний правила
   */
  static async getRuleTriggerHistory(ruleId: string): Promise<RuleTriggerHistory[]> {
    const response = await apiClient.get<RuleTriggerHistory[]>(`/rules/${ruleId}/trigger-history`);
    return response.data;
  }

  /**
   * Тестировать правило на тестовых данных
   */
  static async testRule(data: TestRuleRequest): Promise<TestRuleResponse> {
    const response = await apiClient.post<TestRuleResponse>('/rules/test', data);
    return response.data;
  }

  /**
   * Валидировать Groovy скрипт
   */
  static async validateScript(data: ValidateScriptRequest): Promise<ValidateScriptResponse> {
    const response = await apiClient.post<ValidateScriptResponse>('/rules/validate-script', data);
    return response.data;
  }

  /**
   * Клонировать правило
   */
  static async cloneRule(ruleId: string): Promise<Rule> {
    const response = await apiClient.post<Rule>(`/rules/${ruleId}/clone`);
    return response.data;
  }

  /**
   * Экспортировать правила
   */
  static async exportRules(format: 'json' | 'csv'): Promise<Blob> {
    const response = await apiClient.get(`/rules/export?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Импортировать правила
   */
  static async importRules(file: File): Promise<{ imported: number; failed: number }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<{ imported: number; failed: number }>(
      '/rules/import',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  }
}
