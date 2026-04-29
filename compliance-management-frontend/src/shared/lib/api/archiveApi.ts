import { apiClient } from './apiClient';

export interface ArchiveIncidentItem {
  id: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'RESOLVED' | 'FALSE_POSITIVE' | 'ESCALATED_TO_CASE';
  resolvedAt: string;
}

export interface ArchiveNonComplianceItem {
  id: string;
  title: string;
  source: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  date: string;
}

export interface ArchiveCaseItem {
  id: string;
  title: string;
  description: string;
  status: 'CLOSED' | 'REJECTED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  ownerName: string;
  updatedAt: string;
}

export interface ArchivePlanItem {
  id: string;
  title: string;
  description: string;
  caseTitle: string;
  status: 'COMPLETED' | 'REJECTED';
  progressPercentage: number;
  totalTasks: number;
  completedTasks: number;
  createdAt: string;
}

export class ArchiveApi {
  static async getArchivedIncidents(params: URLSearchParams): Promise<ArchiveIncidentItem[]> {
    const response = await apiClient.get<ArchiveIncidentItem[]>(`/archive/incidents?${params.toString()}`);
    return response.data;
  }

  static async getArchivedNonCompliance(params: URLSearchParams): Promise<ArchiveNonComplianceItem[]> {
    const response = await apiClient.get<ArchiveNonComplianceItem[]>(`/archive/non-compliance?${params.toString()}`);
    return response.data;
  }

  static async getArchivedCases(params: URLSearchParams): Promise<ArchiveCaseItem[]> {
    const response = await apiClient.get<ArchiveCaseItem[]>(`/archive/cases?${params.toString()}`);
    return response.data;
  }

  static async getArchivedPlans(params: URLSearchParams): Promise<ArchivePlanItem[]> {
    const response = await apiClient.get<ArchivePlanItem[]>(`/archive/investigation-plans?${params.toString()}`);
    return response.data;
  }
}
