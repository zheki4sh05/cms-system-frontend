// src/shared/types/incident.types.ts

// Обновить src/shared/types/incident.types.ts - добавить новые типы

export interface IncidentAssignment {
  incidentId: string;
  fromManagerId: string;
  toManagerId: string;
  reason: string;
  reassignedBy: string;
  reassignedAt: string;
}

export interface IncidentEscalation {
  incidentId: string;
  escalatedBy: string;
  escalatedTo: string;
  reason: string;
  urgency: 'HIGH' | 'CRITICAL';
  escalatedAt: string;
}

export interface ManagerWorkload {
  managerId: string;
  managerName: string;
  avatar?: string;
  
  // Текущая нагрузка
  assignedIncidents: number;
  activeIncidents: number;
  newIncidents: number;
  
  // Показатели
  avgResolutionTime: number;
  completionRate: number; // Процент
  overdueIncidents: number;
  
  // Статус
  status: 'AVAILABLE' | 'BUSY' | 'OVERLOADED';
  capacity: number; // 0-100%
}

export interface ReassignIncidentRequest {
  toManagerId: string;
  reason: string;
  notifyManager: boolean;
}

export interface EscalateIncidentRequest {
  reason: string;
  urgency: 'HIGH' | 'CRITICAL';
  requiresImmediateAction: boolean;
}

export interface IncidentDistribution {
  managerId: string;
  managerName: string;
  count: number;
  percentage: number;
}


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
  riskObjectId?: string;
  riskObjectName?: string;
  incidentDescription?: string;
  categoryId?: unknown;
  categoryName?: unknown;
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

export interface IncidentFindingView {
  id: string;
  priority: string;
  assignedUserId?: unknown;
  rulesId?: unknown;
  detectedAt: string;
  details?: Record<string, unknown>;
  incidentId: string;
}

export interface IncidentViewDto {
  findings: IncidentFindingView[];
  documentId?: unknown;
  integrationId?: number;
  integrationName?: unknown;
}

export interface RuleShortInfo {
  id: string;
  companyId: string;
  name: string;
  condition: string;
  categoryId: string;
  priority: string;
  responsibleUserId: string;
}

export interface UserBasicInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
}

export interface AssignToMeResponse {
  id: string;
  incidentId: string;
  findingId: string;
  assignedUserId?: unknown;
  status: string;
  investigation?: {
    id: string;
    caseId: string;
    investigationNotes: string;
    rootCause: string;
    requiresCorrectiveAction: boolean;
    createdAt: string;
    updatedAt: string;
  };
}
