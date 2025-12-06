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

export interface TeamKPI {
  managerId: string;
  managerName: string;
  avatar?: string;
  
  // Метрики производительности
  assignedIncidents: number;
  resolvedIncidents: number;
  activeCases: number;
  completedCases: number;
  
  // Качество работы
  avgResolutionTime: number; // В часах
  falsePositiveRate: number;
  onTimeCompletion: number; // Процент выполненных в срок
  
  // Рейтинг
  performanceScore: number; // 0-100
  rank: number;
}

export interface VerificationQueue {
  id: string;
  type: 'ACTION_PLAN' | 'CASE_CLOSURE';
  title: string;
  submittedBy: string;
  submittedByName: string;
  submittedAt: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  
  // Детали
  caseId?: string;
  actionPlanId?: string;
  estimatedReviewTime: number; // В минутах
  
  // Контекст
  severity?: string;
  incidentCount?: number;
  taskCount?: number;
  completedTasks?: number;
}

export interface ProblemArea {
  id: string;
  category: string;
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Метрики проблемы
  affectedIncidents: number;
  affectedCases: number;
  estimatedImpact: string; // Описание влияния
  
  // Тренд
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  trendPercentage: number;
  
  // Рекомендации
  recommendations: string[];
}

export interface RuleEffectiveness {
  ruleId: string;
  ruleName: string;
  category: string;
  
  // Статистика срабатываний
  totalTriggers: number;
  truePositives: number;
  falsePositives: number;
  
  // Эффективность
  accuracy: number; // Процент
  avgResolutionTime: number;
  
  // Действия
  status: 'ACTIVE' | 'DISABLED' | 'UNDER_REVIEW';
  lastModified: string;
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
