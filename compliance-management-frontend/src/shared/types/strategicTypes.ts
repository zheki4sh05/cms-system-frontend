// src/shared/types/strategic.types.ts

export interface StrategicDashboard {
  period: AnalyticsPeriod;
  lastUpdated: string;
  
  // Ключевые KPI
  kpis: StrategicKPI[];
  
  // Финансовые метрики
  financial: FinancialMetrics;
  
  // Эффективность системы
  systemPerformance: SystemPerformanceMetrics;
  
  // Риски
  riskMetrics: RiskMetrics;
  
  // Операционная эффективность
  operational: OperationalMetrics;
  
  // Тренды
  trends: TrendAnalysis[];
}

export interface AnalyticsPeriod {
  startDate: string;
  endDate: string;
  label: string;
}

export interface StrategicKPI {
  id: string;
  name: string;
  description: string;
  category: KPICategory;
  
  // Текущее значение
  currentValue: number;
  targetValue: number;
  unit: string;
  
  // Динамика
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  
  // Статус достижения цели
  status: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  achievement: number; // процент достижения цели
  
  // История
  history: KPIHistoryPoint[];
}

export type KPICategory = 
  | 'FINANCIAL'
  | 'OPERATIONAL'
  | 'QUALITY'
  | 'RISK'
  | 'COMPLIANCE'
  | 'EFFICIENCY';

export interface KPIHistoryPoint {
  date: string;
  value: number;
  target: number;
}

export interface FinancialMetrics {
  // Выявленные нарушения
  totalViolationsDetected: number;
  violationsAmount: number;
  violationsTrend: number;
  
  // Предотвращенные убытки
  preventedLosses: number;
  preventedLossesTrend: number;
  
  // Возвращенные средства
  recoveredAmount: number;
  recoveredAmountTrend: number;
  
  // ROI системы
  systemROI: number;
  systemROITrend: number;
  
  // Стоимость системы
  systemCosts: number;
  totalSavings: number;
  
  // По категориям
  byCategory: FinancialByCategory[];
  
  // Динамика по месяцам
  monthlyDynamics: FinancialMonthlyData[];
  
  // Прогноз
  forecast: FinancialForecast;
}

export interface FinancialByCategory {
  category: string;
  amount: number;
  count: number;
  percentage: number;
  trend: number;
}

export interface FinancialMonthlyData {
  month: string;
  violations: number;
  prevented: number;
  recovered: number;
  roi: number;
}

export interface FinancialForecast {
  nextQuarterPrevented: number;
  nextQuarterROI: number;
  yearEndProjection: number;
  confidence: number; // 0-100
}

export interface SystemPerformanceMetrics {
  // Общая эффективность
  overallEfficiency: number;
  efficiencyTrend: number;
  
  // Точность обнаружения
  detectionAccuracy: number;
  accuracyTrend: number;
  
  // Скорость обработки
  avgProcessingTime: number;
  processingTimeTrend: number;
  
  // Загрузка системы
  systemLoad: number;
  
  // Активность
  activeRules: number;
  totalRules: number;
  activeUsers: number;
  totalUsers: number;
  
  // Инциденты
  incidentsProcessed: number;
  incidentsResolved: number;
  avgResolutionTime: number;
  resolutionRate: number;
  
  // Производительность правил
  topPerformingRules: RulePerformanceSummary[];
  underperformingRules: RulePerformanceSummary[];
}

export interface RulePerformanceSummary {
  ruleId: string;
  ruleName: string;
  accuracy: number;
  triggers: number;
  impact: number;
}

export interface RiskMetrics {
  // Общий уровень риска
  overallRiskLevel: number; // 0-100
  riskTrend: number;
  riskStatus: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Критичные риски
  criticalRisks: number;
  highRisks: number;
  mediumRisks: number;
  lowRisks: number;
  
  // Риски по категориям
  risksByCategory: RiskByCategory[];
  
  // Топ рисковые поставщики
  topRiskyVendors: VendorRiskSummary[];
  
  // Комплаенс
  complianceScore: number;
  complianceTrend: number;
  complianceViolations: number;
  
  // Карта рисков
  riskMap: RiskMapData[];
}

export interface RiskByCategory {
  category: string;
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  incidents: number;
  trend: number;
}

export interface VendorRiskSummary {
  vendorId: string;
  vendorName: string;
  riskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  incidents: number;
  totalAmount: number;
}

export interface RiskMapData {
  category: string;
  probability: number; // 0-100
  impact: number; // 0-100
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface OperationalMetrics {
  // Производительность команды
  teamEfficiency: number;
  teamEfficiencyTrend: number;
  
  // Загрузка менеджеров
  avgManagerWorkload: number;
  workloadBalance: number; // 0-100, где 100 = идеально сбалансирована
  
  // Случаи
  activeCases: number;
  closedCases: number;
  caseClosureRate: number;
  
  // SLA
  slaCompliance: number;
  slaBreaches: number;
  
  // Автоматизация
  automationRate: number;
  automationTrend: number;
  
  // Производительность по менеджерам
  managerPerformance: ManagerPerformanceSummary[];
}

export interface ManagerPerformanceSummary {
  managerId: string;
  managerName: string;
  efficiency: number;
  workload: number;
  completionRate: number;
  avgResolutionTime: number;
}

export interface TrendAnalysis {
  metric: string;
  category: string;
  currentValue: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  changeRate: number;
  prediction: number;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
  insights: string[];
}

export interface StrategicInsight {
  id: string;
  type: 'OPPORTUNITY' | 'THREAT' | 'RECOMMENDATION' | 'ALERT';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impact: string;
  actionItems: string[];
  affectedKPIs: string[];
  createdAt: string;
}

export interface ExportReportOptions {
  period: AnalyticsPeriod;
  sections: string[];
  format: 'PDF' | 'EXCEL' | 'POWERPOINT';
  includeCharts: boolean;
  includeDetails: boolean;
}
