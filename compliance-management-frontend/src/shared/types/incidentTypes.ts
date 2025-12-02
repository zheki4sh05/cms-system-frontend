// src/shared/types/incident.types.ts

export enum IncidentStatus {
  NEW = 'NEW',
  ASSIGNED = 'ASSIGNED',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  ESCALATED_TO_CASE = 'ESCALATED_TO_CASE',
}

export enum IncidentSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum IncidentCategory {
  FINANCIAL = 'FINANCIAL',
  VENDOR = 'VENDOR',
  COMPLIANCE = 'COMPLIANCE',
  LOGISTICS = 'LOGISTICS',
  DATA_QUALITY = 'DATA_QUALITY',
  ETHICS = 'ETHICS',
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  category: IncidentCategory;
  
  // Правило, которое сработало
  ruleId: string;
  ruleName: string;
  ruleExpression?: string;
  
  // Назначение
  assignedTo: string;
  assignedToName: string;
  
  // Временные метки
  detectedAt: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  
  // Связь со случаем
  caseId?: string;
  caseTitle?: string;
  
  // Источник данных
  sourceSystem: string; // ERP, CRM, 1C и т.д.
  sourceEventId: string;
  payloadJson?: any; // Исходные данные события
  
  // Дополнительная информация
  vendorId?: string;
  vendorName?: string;
  amount?: number;
  departmentId?: string;
  
  // Резолюция
  resolutionNotes?: string;
  falsePositiveReason?: string;
}

export interface IncidentStatistics {
  total: number;
  new: number;
  assigned: number;
  inReview: number;
  resolved: number;
  falsePositive: number;
  escalatedToCase: number;
  
  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  
  byCategory: {
    [key in IncidentCategory]: number;
  };
  
  avgResolutionTime: number; // В часах
}

export interface ResolveIncidentRequest {
  status: IncidentStatus;
  resolutionNotes?: string;
  falsePositiveReason?: string;
}

export interface CreateCaseFromIncidentsRequest {
  incidentIds: string[];
  title: string;
  description: string;
  severity: string;
  priority: string;
}

export interface IncidentFilter {
  status?: IncidentStatus[];
  severity?: IncidentSeverity[];
  category?: IncidentCategory[];
  dateFrom?: string;
  dateTo?: string;
  assignedTo?: string;
  searchQuery?: string;
}
