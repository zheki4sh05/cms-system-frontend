// src/shared/types/supervisor.types.ts

export interface SupervisorDashboardStats {
  // Общие метрики
  totalIncidents: number;
  totalCases: number;
  totalActionPlans: number;
  
  // Тренды
  incidentsTrend: number; // % изменение за период
  casesTrend: number;
  resolutionTimeTrend: number;
  
  // Критичные метрики
  criticalIncidents: number;
  overdueActionPlans: number;
  pendingVerifications: number;
  
  // Эффективность
  avgResolutionTime: number; // В часах
  falsePositiveRate: number; // В процентах
  escalationRate: number; // Процент инцидентов, переведенных в случаи
}

/** Элемент списка GET /api/incidents/kpi/managers (поле items). Для SUPERVISOR — подчинённые; для EXECUTIVE — компания. */
export interface TeamKPI {
  managerId: string;
  managerName: string;

  assignedIncidents: number;
  resolvedIncidents: number;
  activeCases: number;
  completedCases: number;

  /** Среднее время решения инцидента, ч (от earliest finding до resolvedDate) */
  avgResolutionTime: number;
  /** Доля задач плана (DONE) с completedAt <= dueDate, %; при отсутствии DONE — 0 */
  onTimeCompletion: number;
}

export interface ManagersKpiResponse {
  items: TeamKPI[];
}

/** Ответственный по делу (case.assignedUserId → профиль) */
export interface VerificationResponsible {
  userId: string | null;
  employeeId: string | null;
  firstName: string | null;
  lastName: string | null;
}

/** Элемент GET /api/supervisor/verification/pending (поле items) */
export interface PendingVerificationItem {
  actionPlanId: string;
  incidentId: string;
  /** Название документа из finding details или null */
  documentTitle: string | null;
  responsible: VerificationResponsible;
  /** Самая ранняя дата обнаружения по findings, ISO */
  incidentReceivedAt: string | null;
}

export interface PendingVerificationResponse {
  items: PendingVerificationItem[];
}

/** Элемент списка GET /api/incidents/rule-effectiveness (поле items) */
export interface RuleEffectiveness {
  ruleId: string;
  ruleName: string;
  categoryId: string;
  categoryName: string;
  rejectedCount: number;
  closedCount: number;
  /** Из CMS Risk: true только если enabled явно true */
  ruleActive: boolean;
}

export interface RuleEffectivenessResponse {
  items: RuleEffectiveness[];
}

export interface FinancialImpact {
  period: string;
  
  // Выявленные проблемы
  detectedViolationsAmount: number; // Сумма выявленных нарушений
  preventedLosses: number; // Предотвращенные убытки
  
  // ROI системы
  systemCosts: number;
  savings: number;
  roi: number; // Процент
  
  // Распределение по категориям
  byCategory: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

export interface TrendData {
  date: string;
  incidents: number;
  cases: number;
  resolved: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
  trend: number; // % изменение
}

export interface ApproveVerificationRequest {
  approved: boolean;
  comments?: string;
}
