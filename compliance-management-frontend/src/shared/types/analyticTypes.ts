// src/shared/types/analytics.types.ts

export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
  label: string;
}

export interface IncidentTrendData {
  date: string;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  falsePositives: number;
}

export interface CategoryAnalytics {
  category: string;
  categoryLabel: string;
  totalIncidents: number;
  percentage: number;
  avgResolutionTime: number;
  trend: number; // % изменение
  byStatus: {
    new: number;
    assigned: number;
    inReview: number;
    resolved: number;
    falsePositive: number;
  };
}

export interface ManagerPerformanceAnalytics {
  managerId: string;
  managerName: string;
  
  // Объем работы
  totalAssigned: number;
  totalResolved: number;
  activeIncidents: number;
  activeCases: number;
  
  // Эффективность
  avgResolutionTime: number;
  completionRate: number;
  onTimeCompletion: number;
  
  // Качество
  falsePositiveRate: number;
  escalationRate: number;
  
  // Сравнение с предыдущим периодом
  resolutionTimeTrend: number;
  completionRateTrend: number;
}

export interface RulePerformanceAnalytics {
  ruleId: string;
  ruleName: string;
  category: string;
  
  // Статистика срабатываний
  totalTriggers: number;
  truePositives: number;
  falsePositives: number;
  
  // Эффективность
  accuracy: number;
  precision: number;
  recall: number;
  
  // Результаты
  escalatedToCases: number;
  avgImpact: number; // средняя сумма выявленных нарушений
  
  // Временные метрики
  avgDetectionTime: number;
  avgResolutionTime: number;
  
  // Тренд
  triggersTrend: number;
  accuracyTrend: number;
}

export interface FinancialAnalytics {
  period: string;
  
  // Выявленные нарушения
  totalViolationsAmount: number;
  totalViolationsCount: number;
  
  // Предотвращенные убытки
  preventedLosses: number;
  recoveredAmount: number;
  
  // ROI системы
  systemCosts: number;
  savings: number;
  roi: number;
  
  // По категориям
  byCategory: {
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  
  // По месяцам
  byMonth: {
    month: string;
    violations: number;
    prevented: number;
    recovered: number;
  }[];
}

export interface ComplianceAnalytics {
  period: string;
  
  // Общая статистика
  totalChecks: number;
  violationsDetected: number;
  complianceRate: number;
  
  // По типам комплаенса
  byType: {
    type: string;
    typeLabel: string;
    checks: number;
    violations: number;
    rate: number;
  }[];
  
  // Критичные области
  criticalAreas: {
    area: string;
    violations: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    trend: number;
  }[];
}

export interface VendorRiskAnalytics {
  vendorId: string;
  vendorName: string;
  
  // Риск-профиль
  riskScore: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Инциденты
  totalIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  
  // Финансы
  totalTransactionAmount: number;
  violationsAmount: number;
  
  // Комплаенс
  licenseStatus: 'VALID' | 'EXPIRING' | 'EXPIRED' | 'MISSING';
  documentationComplete: boolean;
  
  // История
  incidentsTrend: number;
  riskTrend: number;
  
  // Категории инцидентов
  incidentsByCategory: {
    category: string;
    count: number;
  }[];
}

export interface DashboardSummary {
  period: AnalyticsPeriod;
  
  // Ключевые метрики
  totalIncidents: number;
  incidentsTrend: number;
  
  totalCases: number;
  casesTrend: number;
  
  avgResolutionTime: number;
  resolutionTimeTrend: number;
  
  systemEfficiency: number; // 0-100
  efficiencyTrend: number;
  
  // Топ проблемы
  topCategories: {
    category: string;
    count: number;
    percentage: number;
  }[];
  
  topRules: {
    ruleName: string;
    triggers: number;
    accuracy: number;
  }[];
  
  topVendors: {
    vendorName: string;
    incidents: number;
    riskScore: number;
  }[];
}

export interface ReportExportOptions {
  period: AnalyticsPeriod;
  includeCharts: boolean;
  includeTables: boolean;
  includeDetails: boolean;
  sections: string[];
}
