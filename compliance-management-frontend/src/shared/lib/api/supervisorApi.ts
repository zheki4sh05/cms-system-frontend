// src/shared/lib/api/supervisorApi.ts

import { apiClient } from './apiClient';
import type {
  SupervisorDashboardStats,
  TeamKPI,
  VerificationQueue,
  ProblemArea,
  RuleEffectiveness,
  FinancialImpact,
  TrendData,
  CategoryDistribution,
  ApproveVerificationRequest,
} from '@shared/types/supervisorTypes';

export class SupervisorApi {
  /**
   * Получить основные метрики для панели руководителя
   */
  static async getDashboardStats(): Promise<SupervisorDashboardStats> {
    const response = await apiClient.get<SupervisorDashboardStats>('/supervisor/dashboard/stats');
    return response.data;
  }

  /**
   * Получить KPI команды
   */
  static async getTeamKPI(): Promise<TeamKPI[]> {
    const response = await apiClient.get<TeamKPI[]>('/supervisor/team/kpi');
    return response.data;
  }

  /**
   * Получить очередь на верификацию
   */
  static async getVerificationQueue(): Promise<VerificationQueue[]> {
    const response = await apiClient.get<VerificationQueue[]>('/supervisor/verification/queue');
    return response.data;
  }

  /**
   * Утвердить или отклонить верификацию
   */
  static async processVerification(
    itemId: string,
    data: ApproveVerificationRequest
  ): Promise<void> {
    await apiClient.put(`/supervisor/verification/${itemId}/process`, data);
  }

  /**
   * Получить проблемные зоны
   */
  static async getProblemAreas(): Promise<ProblemArea[]> {
    const response = await apiClient.get<ProblemArea[]>('/supervisor/analytics/problem-areas');
    return response.data;
  }

  /**
   * Получить эффективность правил
   */
  static async getRuleEffectiveness(): Promise<RuleEffectiveness[]> {
    const response = await apiClient.get<RuleEffectiveness[]>('/supervisor/analytics/rule-effectiveness');
    return response.data;
  }

  /**
   * Получить финансовое влияние
   */
  static async getFinancialImpact(): Promise<FinancialImpact> {
    const response = await apiClient.get<FinancialImpact>('/supervisor/analytics/financial-impact');
    return response.data;
  }

  /**
   * Получить данные трендов
   */
  static async getTrendData(period: 'week' | 'month' | 'quarter'): Promise<TrendData[]> {
    const response = await apiClient.get<TrendData[]>(`/supervisor/analytics/trends?period=${period}`);
    return response.data;
  }

  /**
   * Получить распределение по категориям
   */
  static async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const response = await apiClient.get<CategoryDistribution[]>('/supervisor/analytics/categories');
    return response.data;
  }

  /**
   * Экспортировать отчет
   */
  static async exportReport(format: 'pdf' | 'excel', period: string): Promise<Blob> {
    const response = await apiClient.get(`/supervisor/reports/export?format=${format}&period=${period}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}
