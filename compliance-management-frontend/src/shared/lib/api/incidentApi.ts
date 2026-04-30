// src/shared/lib/api/incidentApi.ts

import { apiClient } from './apiClient';
import type {
  Incident,
  IncidentStatistics,
  ResolveIncidentRequest,
  CreateCaseFromIncidentsRequest,
  IncidentFilter,
  ManagerWorkload,
  IncidentDistribution,
  ReassignIncidentRequest,
  EscalateIncidentRequest,
  IncidentAssignment,
} from '@shared/types/incidentTypes';
import type { Case } from '@shared/types/caseTypes';

export class IncidentApi {
  private static normalizeStatus(status: unknown): Incident['status'] {
    if (typeof status !== 'string') return 'NEW';
    const normalized = status.toUpperCase();
    const statusMap: Record<string, Incident['status']> = {
      NEW: 'NEW',
      OPEN: 'NEW',
      ASSIGNED: 'ASSIGNED',
      PARTLY_PROGRESS: 'ASSIGNED',
      IN_PROGRESS: 'IN_REVIEW',
      IN_REVIEW: 'IN_REVIEW',
      RESOLVED: 'RESOLVED',
      CLOSED: 'RESOLVED',
      FALSE_POSITIVE: 'FALSE_POSITIVE',
      ESCALATED_TO_CASE: 'ESCALATED_TO_CASE',
    };

    return statusMap[normalized] || 'NEW';
  }

  private static normalizeSeverity(severity: unknown): Incident['severity'] {
    if (typeof severity !== 'string') return 'LOW';
    const normalized = severity.toUpperCase();
    if (
      normalized === 'LOW' ||
      normalized === 'MEDIUM' ||
      normalized === 'HIGH' ||
      normalized === 'CRITICAL'
    ) {
      return normalized;
    }
    return 'LOW';
  }

  private static normalizeIncident(incident: Partial<Incident>): Incident {
    const riskObjectName = typeof incident.riskObjectName === 'string' ? incident.riskObjectName : '';
    const incidentDescription =
      typeof incident.incidentDescription === 'string' ? incident.incidentDescription : '';
    const detectedAt =
      typeof incident.detectedAt === 'string' && incident.detectedAt.length > 0
        ? incident.detectedAt
        : new Date().toISOString();

    return {
      id: incident.id || '',
      riskObjectId: incident.riskObjectId,
      riskObjectName: incident.riskObjectName,
      incidentDescription: incident.incidentDescription,
      categoryId: incident.categoryId,
      categoryName: incident.categoryName,
      title: incident.title || riskObjectName || 'Инцидент',
      description: incident.description || incidentDescription || '-',
      status: this.normalizeStatus(incident.status),
      severity: this.normalizeSeverity(incident.severity),
      category: incident.category || 'COMPLIANCE',
      ruleId: incident.ruleId || '',
      ruleName: incident.ruleName || '-',
      ruleExpression: incident.ruleExpression,
      assignedTo: incident.assignedTo || '',
      assignedToName: incident.assignedToName || '',
      detectedAt,
      createdAt: incident.createdAt || detectedAt,
      updatedAt: incident.updatedAt || detectedAt,
      resolvedAt: incident.resolvedAt,
      caseId: incident.caseId,
      caseTitle: incident.caseTitle,
      sourceSystem: incident.sourceSystem || '-',
      sourceEventId: incident.sourceEventId || '',
      payloadJson: incident.payloadJson,
      vendorId: incident.vendorId,
      vendorName: incident.vendorName,
      amount: incident.amount,
      departmentId: incident.departmentId,
      resolutionNotes: incident.resolutionNotes,
      falsePositiveReason: incident.falsePositiveReason,
    };
  }

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
    
    const response = await apiClient.get<Partial<Incident>[]>(`/incidents/my?${params.toString()}`);
    return response.data.map((incident) => this.normalizeIncident(incident));
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

  /**
   * Получить нагрузку всех менеджеров (только для руководителя)
   */
  static async getManagersWorkload(): Promise<ManagerWorkload[]> {
    const response = await apiClient.get<ManagerWorkload[]>('/incidents/managers-workload');
    return response.data;
  }

  /**
   * Получить распределение инцидентов по менеджерам
   */
  static async getIncidentDistribution(): Promise<IncidentDistribution[]> {
    const response = await apiClient.get<IncidentDistribution[]>('/incidents/distribution');
    return response.data;
  }

  /**
   * Переназначить инцидент другому менеджеру
   */
  static async reassignIncident(
    incidentId: string,
    data: ReassignIncidentRequest
  ): Promise<Incident> {
    const response = await apiClient.post<Incident>(
      `/incidents/${incidentId}/reassign`,
      data
    );
    return response.data;
  }

  /**
   * Эскалировать инцидент топ-менеджменту
   */
  static async escalateIncident(
    incidentId: string,
    data: EscalateIncidentRequest
  ): Promise<Incident> {
    const response = await apiClient.post<Incident>(
      `/incidents/${incidentId}/escalate`,
      data
    );
    return response.data;
  }

  /**
   * Получить историю переназначений инцидента
   */
  static async getIncidentAssignmentHistory(incidentId: string): Promise<IncidentAssignment[]> {
    const response = await apiClient.get<IncidentAssignment[]>(
      `/incidents/${incidentId}/assignment-history`
    );
    return response.data;
  }
}
