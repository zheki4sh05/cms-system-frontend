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
  PARTLY_PROGRESS = 'PARTLY_PROGRESS',
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
  /** Участники (userId), приходит с GET /api/incidents/my */
  employees?: Array<{ userId: string }>;
  /** Связь исполнителя с кейсом (MANAGER, GET /api/incidents/my) */
  cases?: IncidentEmployeeCase[];

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
  payloadJson?: unknown; // Исходные данные события
  
  // Дополнительная информация
  vendorId?: string;
  vendorName?: string;
  amount?: number;
  departmentId?: string;
  
  // Резолюция
  resolutionNotes?: string;
  falsePositiveReason?: string;
}

/** Запись cases[] в ответе GET /api/incidents/my для MANAGER */
export interface IncidentEmployeeCase {
  /** userId исполнителя */
  id: string;
  /** id кейса после «взять в работу»; null или {} — работа ещё не начата */
  caseId: string | null;
}

/** GET /api/incidents/my/stats — для EXECUTIVE полный охват компании; для других ролей — по правам бэкенда */
export interface IncidentStatistics {
  totalIncidents: number;
  totalFindings: number;
  totalCases: number;
  new: number;
  assigned: number;
  inReview: number;
  resolved: number;

  bySeverity: {
    low: number;
    medium: number;
    high: number;
    critical?: number;
  };

  byCategory: Array<{
    /** Может прийти строкой или объектом (например пустой {}) */
    categoryId: string | null;
    categoryName: string;
    incidentCount: number;
  }>;

  avgResolutionTime: number; // В часах
  /** По сути дублирует bySeverity.high для компании */
  criticalIncidents: number;
  overdueActionPlans: number;
  pendingVerifications: number;
}

export interface IncidentSummaryStats {
  totalIncidents: number;
  totalFindings: number;
  totalCases: number;
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
  id?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
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

export interface IncidentReportTaskEvidence {
  id: string;
  userId: string;
  fileId: string;
  name: string;
  time: string;
}

export interface IncidentReportTask {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string;
  status: string;
  evidenceDescriptionInprogress?: unknown;
  evidenceDescriptionDone?: unknown;
  completedAt?: unknown;
  evidences: IncidentReportTaskEvidence[];
}

export interface IncidentReportActionPlan {
  id: string;
  incidentId: string;
  caseId: string;
  title?: unknown;
  description?: unknown;
  comment?: unknown;
  verification?: {
    id: string;
    actionPlanId: string;
    verified: boolean;
    assignedUserForVerification?: string;
    assignedEmployeeForVerification?: string;
    comments?: unknown;
  };
  tasks: IncidentReportTask[];
}

export interface IncidentReportCase {
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
  comments: Array<{
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    comment: string;
    time: string;
  }>;
  attachments: Array<{
    id: string;
    userId: string;
    firstName?: string;
    lastName?: string;
    fileId: string;
    name: string;
    size: number;
    time: string;
  }>;
  actionPlan?: IncidentReportActionPlan;
}

export interface IncidentReportFinding {
  id: string;
  priority: string;
  assignedUserId?: unknown;
  ruleName?: unknown;
  details?: Record<string, unknown>;
  cases: IncidentReportCase[];
}

export interface IncidentReportIncident {
  id: string;
  companyId: string;
  integrationId: number;
  riskObjectId: string;
  riskObjectName?: unknown;
  documentId?: unknown;
  integrationName?: unknown;
  status: string;
}

export interface IncidentReportItem {
  incident: IncidentReportIncident;
  findings: IncidentReportFinding[];
}

export interface IncidentReportsPageResult {
  items: IncidentReportItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Группа по documentId за месяц (GET /api/incidents/problem-areas) */
export interface IncidentProblemAreaGroup {
  documentId: string;
  incidentCount: number;
  incidents: IncidentReportItem[];
}

export interface IncidentProblemAreasResponse {
  /** YYYY-MM, UTC */
  month: string;
  groups: IncidentProblemAreaGroup[];
}

/** GET /api/incidents/overview — область охвата данных */
export type IncidentsOverviewScope = 'COMPANY' | 'DEPARTMENT';

export type IncidentWorkflowStatusOverview = 'OPEN' | 'PARTLY_PROGRESS' | 'IN_PROGRESS' | 'RESOLVED';

export interface IncidentsOverviewIncidentsBlock {
  /** Число инцидентов в выборке: из поля total API или сумма по статусам */
  total: number;
  /** Количества по статусам инцидента */
  byStatus: Partial<Record<IncidentWorkflowStatusOverview, number>>;
  withDocumentId: number;
  withoutDocumentId: number;
  /** Не RESOLVED, минимальная дата находки старше 14 суток */
  staleUnresolved: number;
}

export interface IncidentsOverviewFindingsBlock {
  total: number;
  /** Finding без назначенного пользователя */
  withoutAssignedUser: number;
}

export interface IncidentsOverviewCasesBlock {
  total: number;
  waitingVerification: number;
  closed: number;
  other: number;
}

export interface IncidentsOverviewActionPlansBlock {
  withOverdueTasks: number;
}

export interface IncidentRiskHotspotItem {
  riskObjectId: string;
  incidentCount: number;
  /** Имя из CMS_MONITORING при наличии */
  name?: string | null;
}

export interface IncidentsOverviewSeverityDistribution {
  low: number;
  medium: number;
  high: number;
  unknown: number;
}

export interface IncidentsOverviewResponse {
  scope: IncidentsOverviewScope;
  incidents: IncidentsOverviewIncidentsBlock;
  findings: IncidentsOverviewFindingsBlock;
  cases: IncidentsOverviewCasesBlock;
  actionPlans: IncidentsOverviewActionPlansBlock;
  riskHotspots: IncidentRiskHotspotItem[];
  incidentsByRiskObjectSeverity: IncidentsOverviewSeverityDistribution;
}
