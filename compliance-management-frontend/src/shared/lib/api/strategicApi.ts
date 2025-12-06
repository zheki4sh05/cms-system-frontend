// src/shared/lib/api/strategicApi.ts

import { apiClient } from './apiClient';
import type {
  StrategicDashboard,
  AnalyticsPeriod,
  StrategicInsight,
  ExportReportOptions,
} from '@shared/types/strategicTypes';

export class StrategicApi {
  /**
   * Получить данные стратегической панели
   */
  static async getDashboard(period: AnalyticsPeriod): Promise<StrategicDashboard> {
    const response = await apiClient.post<StrategicDashboard>('/strategic/dashboard', period);
    return response.data;
  }

  /**
   * Получить стратегические инсайты
   */
  static async getInsights(period: AnalyticsPeriod): Promise<StrategicInsight[]> {
    const response = await apiClient.post<StrategicInsight[]>('/strategic/insights', period);
    return response.data;
  }

  /**
   * Экспортировать стратегический отчет
   */
  static async exportReport(options: ExportReportOptions): Promise<Blob> {
    const response = await apiClient.post('/strategic/export', options, {
      responseType: 'blob',
    });
    return response.data;
  }

  /**
   * Обновить целевое значение KPI
   */
  static async updateKPITarget(kpiId: string, targetValue: number): Promise<void> {
    await apiClient.put(`/strategic/kpi/${kpiId}/target`, { targetValue });
  }
}
