// src/shared/lib/api/incidentApi.ts

import { apiClient } from './apiClient';
import type {
  Incident,
  IncidentStatistics,
  ResolveIncidentRequest,
  CreateCaseFromIncidentsRequest,
  IncidentFilter,
} from '@shared/types/incidentTypes';
import type { Case } from '@shared/types/caseTypes';

export class IncidentApi {
  /**
   * Получить все инциденты текущего пользователя
   */
  static async getMyIncidents(filter?: IncidentFilter): Promise<Incident[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.status?.length) params.append('status', filter.status.join(','));
      if (filter.severity?.length) params.append('severity', filter.severity.join(','));
      if (filter.category?.length) params.append('category', filter.category.join(','));
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.searchQuery) params.append('q', filter.searchQuery);
    }
    
    const response = await apiClient.get<Incident[]>(`/incidents/my?${params.toString()}`);
    return response.data;
  }

  /**
   * Получить статистику по инцидентам
   */
  static async getIncidentStatistics(): Promise<IncidentStatistics> {
    const response = await apiClient.get<IncidentStatistics>('/incidents/statistics');
    return response.data;
  }

  /**
   * Получить инцидент по ID
   */
  static async getIncident(incidentId: string): Promise<Incident> {
    const response = await apiClient.get<Incident>(`/incidents/${incidentId}`);
    return response.data;
  }

  /**
   * Разрешить инцидент (закрыть как ложное срабатывание или решенный)
   */
  static async resolveIncident(
    incidentId: string, 
    data: ResolveIncidentRequest
  ): Promise<Incident> {
    const response = await apiClient.post<Incident>(
      `/incidents/${incidentId}/resolve`, 
      data
    );
    return response.data;
  }

  /**
   * Создать случай из инцидентов
   */
  static async createCaseFromIncidents(
    data: CreateCaseFromIncidentsRequest
  ): Promise<Case> {
    const response = await apiClient.post<Case>('/incidents/create-case', data);
    return response.data;
  }

  /**
   * Взять инцидент в работу
   */
  static async assignToMe(incidentId: string): Promise<Incident> {
    const response = await apiClient.post<Incident>(`/incidents/${incidentId}/assign-to-me`);
    return response.data;
  }

  /**
   * Получить похожие инциденты (для группировки)
   */
  static async getSimilarIncidents(incidentId: string): Promise<Incident[]> {
    const response = await apiClient.get<Incident[]>(`/incidents/${incidentId}/similar`);
    return response.data;
  }
}
