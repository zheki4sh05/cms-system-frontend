// src/shared/lib/api/analyticsApi.ts

import { apiClient } from './apiClient';
import type {
  AnalyticsPeriod,
  DashboardSummary,
  IncidentTrendData,
  CategoryAnalytics,
  ManagerPerformanceAnalytics,
  RulePerformanceAnalytics,
  FinancialAnalytics,
  ComplianceAnalytics,
  VendorRiskAnalytics,
  ReportExportOptions,
} from '@shared/types/analyticTypes';

export class AnalyticsApi {
  /**
   * Получить сводку по всем метрикам
   */
  static async getDashboardSummary(period: AnalyticsPeriod): Promise<DashboardSummary> {
    const response = await apiClient.post<DashboardSummary>('/analytics/summary', period);
    return response.data;
  }

  /**
   * Получить тренд инцидентов
   */
  static async getIncidentTrends(period: AnalyticsPeriod): Promise<IncidentTrendData[]> {
    const response = await apiClient.post<IncidentTrendData[]>('/analytics/incident-trends', period);
    return response.data;
  }

  /**
   * Получить аналитику по категориям
   */
  static async getCategoryAnalytics(period: AnalyticsPeriod): Promise<CategoryAnalytics[]> {
    const response = await apiClient.post<CategoryAnalytics[]>('/analytics/categories', period);
    return response.data;
  }

  /**
   * Получить аналитику производительности менеджеров
   */
  static async getManagerPerformance(period: AnalyticsPeriod): Promise<ManagerPerformanceAnalytics[]> {
    const response = await apiClient.post<ManagerPerformanceAnalytics[]>(
      '/analytics/manager-performance',
      period
    );
    return response.data;
  }

  /**
   * Получить аналитику эффективности правил
   */
  static async getRulePerformance(period: AnalyticsPeriod): Promise<RulePerformanceAnalytics[]> {
    const response = await apiClient.post<RulePerformanceAnalytics[]>(
      '/analytics/rule-performance',
      period
    );
    return response.data;
  }

  /**
   * Получить финансовую аналитику
   */
  static async getFinancialAnalytics(period: AnalyticsPeriod): Promise<FinancialAnalytics> {
    const response = await apiClient.post<FinancialAnalytics>('/analytics/financial', period);
    return response.data;
  }

  /**
   * Получить аналитику комплаенса
   */
  static async getComplianceAnalytics(period: AnalyticsPeriod): Promise<ComplianceAnalytics> {
    const response = await apiClient.post<ComplianceAnalytics>('/analytics/compliance', period);
    return response.data;
  }

  /**
   * Получить аналитику рисков по поставщикам
   */
  static async getVendorRiskAnalytics(period: AnalyticsPeriod): Promise<VendorRiskAnalytics[]> {
    const response = await apiClient.post<VendorRiskAnalytics[]>('/analytics/vendor-risk', period);
    return response.data;
  }

  /**
   * Экспортировать отчет в PDF
   */
  static async exportReport(options: ReportExportOptions): Promise<Blob> {
    const response = await apiClient.post('/analytics/export-pdf', options, {
      responseType: 'blob',
    });
    return response.data;
  }
}
