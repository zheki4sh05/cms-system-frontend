// src/mocks/handlers_analytics.ts

import { http, HttpResponse, delay } from 'msw';
import type {
  AnalyticsPeriod,
  DashboardSummary,
  IncidentTrendData,
  CategoryAnalytics,
  ManagerPerformanceAnalytics,
  RulePerformanceAnalytics,
  FinancialAnalytics,
  ComplianceAnalytics,
  VendorRiskAnalytics,
  ReportExportOptions,
} from '@shared/types/analyticTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Вспомогательная функция для генерации дат
const generateDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    dates.push(start.toISOString().split('T')[0]);
    start.setDate(start.getDate() + 1);
  }
  
  return dates;
};

// Моковая сводка
const generateDashboardSummary = (period: AnalyticsPeriod): DashboardSummary => {
  return {
    period,
    totalIncidents: 156,
    incidentsTrend: 8.5,
    totalCases: 23,
    casesTrend: -5.2,
    avgResolutionTime: 36,
    resolutionTimeTrend: -12.3,
    systemEfficiency: 87,
    efficiencyTrend: 4.2,
    topCategories: [
      { category: 'Финансы', count: 58, percentage: 37 },
      { category: 'Комплаенс', count: 34, percentage: 22 },
      { category: 'Логистика', count: 28, percentage: 18 },
      { category: 'Качество данных', count: 21, percentage: 13 },
      { category: 'Этика', count: 15, percentage: 10 },
    ],
    topRules: [
      { ruleName: 'Конфликт интересов при закупках', triggers: 8, accuracy: 100 },
      { ruleName: 'Превышение лимита без согласования', triggers: 45, accuracy: 91 },
      { ruleName: 'Истекшая лицензия поставщика', triggers: 12, accuracy: 92 },
      { ruleName: 'Изменение цен после согласования', triggers: 34, accuracy: 88 },
      { ruleName: 'Систематическое нарушение сроков', triggers: 28, accuracy: 82 },
    ],
    topVendors: [
      { vendorName: 'ООО "Гамма Логистика"', incidents: 12, riskScore: 85 },
      { vendorName: 'ООО "Техноком"', incidents: 8, riskScore: 78 },
      { vendorName: 'ИП Смирнов А.А.', incidents: 6, riskScore: 72 },
      { vendorName: 'ООО "Альфа Поставка"', incidents: 5, riskScore: 65 },
      { vendorName: 'ЗАО "БетаТрейд"', incidents: 4, riskScore: 58 },
    ],
  };
};

// Моковый тренд инцидентов
const generateIncidentTrends = (period: AnalyticsPeriod): IncidentTrendData[] => {
  const dates = generateDateRange(period.startDate, period.endDate);
  
  return dates.map(date => ({
    date,
    total: Math.floor(Math.random() * 15) + 5,
    critical: Math.floor(Math.random() * 3),
    high: Math.floor(Math.random() * 5) + 2,
    medium: Math.floor(Math.random() * 4) + 1,
    low: Math.floor(Math.random() * 3),
    resolved: Math.floor(Math.random() * 10) + 3,
    falsePositives: Math.floor(Math.random() * 2),
  }));
};

// Моковая аналитика по категориям
const mockCategoryAnalytics: CategoryAnalytics[] = [
  {
    category: 'FINANCIAL',
    categoryLabel: 'Финансы',
    totalIncidents: 58,
    percentage: 37,
    avgResolutionTime: 32,
    trend: 8.5,
    byStatus: {
      new: 8,
      assigned: 12,
      inReview: 15,
      resolved: 20,
      falsePositive: 3,
    },
  },
  {
    category: 'COMPLIANCE',
    categoryLabel: 'Комплаенс',
    totalIncidents: 34,
    percentage: 22,
    avgResolutionTime: 28,
    trend: -5.2,
    byStatus: {
      new: 4,
      assigned: 8,
      inReview: 10,
      resolved: 11,
      falsePositive: 1,
    },
  },
  {
    category: 'LOGISTICS',
    categoryLabel: 'Логистика',
    totalIncidents: 28,
    percentage: 18,
    avgResolutionTime: 42,
    trend: 12.3,
    byStatus: {
      new: 5,
      assigned: 7,
      inReview: 8,
      resolved: 7,
      falsePositive: 1,
    },
  },
  {
    category: 'DATA_QUALITY',
    categoryLabel: 'Качество данных',
    totalIncidents: 21,
    percentage: 13,
    avgResolutionTime: 18,
    trend: 0,
    byStatus: {
      new: 3,
      assigned: 5,
      inReview: 6,
      resolved: 6,
      falsePositive: 1,
    },
  },
  {
    category: 'ETHICS',
    categoryLabel: 'Этика',
    totalIncidents: 15,
    percentage: 10,
    avgResolutionTime: 48,
    trend: -15.8,
    byStatus: {
      new: 2,
      assigned: 3,
      inReview: 4,
      resolved: 5,
      falsePositive: 1,
    },
  },
];

// Моковая производительность менеджеров
const mockManagerPerformance: ManagerPerformanceAnalytics[] = [
  {
    managerId: '3',
    managerName: 'Иван Иванов',
    totalAssigned: 45,
    totalResolved: 42,
    activeIncidents: 12,
    activeCases: 8,
    avgResolutionTime: 28,
    completionRate: 94,
    onTimeCompletion: 92,
    falsePositiveRate: 5.2,
    escalationRate: 8.9,
    resolutionTimeTrend: -8.5,
    completionRateTrend: 3.2,
  },
  {
    managerId: '4',
    managerName: 'Петр Петров',
    totalAssigned: 38,
    totalResolved: 34,
    activeIncidents: 8,
    activeCases: 6,
    avgResolutionTime: 32,
    completionRate: 89,
    onTimeCompletion: 87,
    falsePositiveRate: 7.1,
    escalationRate: 10.5,
    resolutionTimeTrend: -5.2,
    completionRateTrend: 1.8,
  },
  {
    managerId: '5',
    managerName: 'Мария Сидорова',
    totalAssigned: 42,
    totalResolved: 37,
    activeIncidents: 18,
    activeCases: 7,
    avgResolutionTime: 35,
    completionRate: 86,
    onTimeCompletion: 84,
    falsePositiveRate: 9.5,
    escalationRate: 14.3,
    resolutionTimeTrend: 2.1,
    completionRateTrend: -2.5,
  },
  {
    managerId: '6',
    managerName: 'Алексей Смирнов',
    totalAssigned: 31,
    totalResolved: 26,
    activeIncidents: 7,
    activeCases: 5,
    avgResolutionTime: 41,
    completionRate: 78,
    onTimeCompletion: 75,
    falsePositiveRate: 12.3,
    escalationRate: 16.1,
    resolutionTimeTrend: 8.7,
    completionRateTrend: -5.2,
  },
];

// Моковая эффективность правил
const mockRulePerformance: RulePerformanceAnalytics[] = [
  {
    ruleId: 'RULE-001',
    ruleName: 'Конфликт интересов при закупках',
    category: 'Этика',
    totalTriggers: 8,
    truePositives: 8,
    falsePositives: 0,
    accuracy: 100,
    precision: 100,
    recall: 100,
    escalatedToCases: 8,
    avgImpact: 850000,
    avgDetectionTime: 12,
    avgResolutionTime: 48,
    triggersTrend: 0,
    accuracyTrend: 0,
  },
  {
    ruleId: 'RULE-002',
    ruleName: 'Превышение лимита без согласования',
    category: 'Финансы',
    totalTriggers: 45,
    truePositives: 41,
    falsePositives: 4,
    accuracy: 91,
    precision: 91,
    recall: 95,
    escalatedToCases: 12,
    avgImpact: 320000,
    avgDetectionTime: 8,
    avgResolutionTime: 24,
    triggersTrend: 12.5,
    accuracyTrend: 3.2,
  },
  {
    ruleId: 'RULE-003',
    ruleName: 'Истекшая лицензия поставщика',
    category: 'Комплаенс',
    totalTriggers: 12,
    truePositives: 11,
    falsePositives: 1,
    accuracy: 92,
    precision: 92,
    recall: 100,
    escalatedToCases: 3,
    avgImpact: 0,
    avgDetectionTime: 24,
    avgResolutionTime: 18,
    triggersTrend: -8.3,
    accuracyTrend: 5.1,
  },
  {
    ruleId: 'RULE-004',
    ruleName: 'Систематическое нарушение сроков',
    category: 'Логистика',
    totalTriggers: 28,
    truePositives: 23,
    falsePositives: 5,
    accuracy: 82,
    precision: 82,
    recall: 88,
    escalatedToCases: 5,
    avgImpact: 120000,
    avgDetectionTime: 72,
    avgResolutionTime: 36,
    triggersTrend: 15.2,
    accuracyTrend: -3.5,
  },
  {
    ruleId: 'RULE-005',
    ruleName: 'Дубликаты контрагентов',
    category: 'Качество данных',
    totalTriggers: 19,
    truePositives: 15,
    falsePositives: 4,
    accuracy: 79,
    precision: 79,
    recall: 83,
    escalatedToCases: 2,
    avgImpact: 0,
    avgDetectionTime: 6,
    avgResolutionTime: 12,
    triggersTrend: 0,
    accuracyTrend: -2.1,
  },
  {
    ruleId: 'RULE-006',
    ruleName: 'Изменение цен после согласования',
    category: 'Финансы',
    totalTriggers: 34,
    truePositives: 30,
    falsePositives: 4,
    accuracy: 88,
    precision: 88,
    recall: 94,
    escalatedToCases: 4,
    avgImpact: 280000,
    avgDetectionTime: 18,
    avgResolutionTime: 28,
    triggersTrend: 23.5,
    accuracyTrend: 1.8,
  },
];

// Моковая финансовая аналитика
const mockFinancialAnalytics: FinancialAnalytics = {
  period: 'Ноябрь 2024',
  totalViolationsAmount: 8450000,
  totalViolationsCount: 156,
  preventedLosses: 6230000,
  recoveredAmount: 1850000,
  systemCosts: 450000,
  savings: 5780000,
  roi: 1284,
  byCategory: [
    { category: 'Финансы', amount: 4850000, count: 58, percentage: 57 },
    { category: 'Комплаенс', amount: 1920000, count: 34, percentage: 23 },
    { category: 'Логистика', amount: 1240000, count: 28, percentage: 15 },
    { category: 'Этика', amount: 440000, count: 15, percentage: 5 },
  ],
  byMonth: [
    { month: 'Сентябрь', violations: 7200000, prevented: 5800000, recovered: 1600000 },
    { month: 'Октябрь', violations: 7850000, prevented: 6100000, recovered: 1750000 },
    { month: 'Ноябрь', violations: 8450000, prevented: 6230000, recovered: 1850000 },
  ],
};

// Моковая аналитика комплаенса
const mockComplianceAnalytics: ComplianceAnalytics = {
  period: 'Ноябрь 2024',
  totalChecks: 1240,
  violationsDetected: 87,
  complianceRate: 93,
  byType: [
    {
      type: 'LICENSE',
      typeLabel: 'Лицензии и разрешения',
      checks: 320,
      violations: 12,
      rate: 96,
    },
    {
      type: 'TAX',
      typeLabel: 'Налоговые требования',
      checks: 280,
      violations: 8,
      rate: 97,
    },
    {
      type: 'CONTRACT',
      typeLabel: 'Договорные обязательства',
      checks: 420,
      violations: 45,
      rate: 89,
    },
    {
      type: 'DOCUMENTATION',
      typeLabel: 'Документация',
      checks: 220,
      violations: 22,
      rate: 90,
    },
  ],
  criticalAreas: [
    {
      area: 'Истечение лицензий медицинского оборудования',
      violations: 8,
      severity: 'HIGH',
      trend: -15,
    },
    {
      area: 'Несоблюдение условий договоров поставки',
      violations: 23,
      severity: 'MEDIUM',
      trend: 12,
    },
    {
      area: 'Неполная документация по импорту',
      violations: 12,
      severity: 'MEDIUM',
      trend: 0,
    },
    {
      area: 'Нарушения требований по НДС',
      violations: 5,
      severity: 'LOW',
      trend: -8,
    },
  ],
};

// Моковая аналитика рисков поставщиков
const mockVendorRiskAnalytics: VendorRiskAnalytics[] = [
  {
    vendorId: 'VENDOR-001',
    vendorName: 'ООО "Гамма Логистика"',
    riskScore: 85,
    riskLevel: 'HIGH',
    totalIncidents: 12,
    criticalIncidents: 2,
    resolvedIncidents: 8,
    totalTransactionAmount: 15600000,
    violationsAmount: 840000,
    licenseStatus: 'VALID',
    documentationComplete: false,
    incidentsTrend: 15.2,
    riskTrend: 8.5,
    incidentsByCategory: [
      { category: 'Логистика', count: 7 },
      { category: 'Финансы', count: 3 },
      { category: 'Комплаенс', count: 2 },
    ],
  },
  {
    vendorId: 'VENDOR-002',
    vendorName: 'ООО "Техноком"',
    riskScore: 78,
    riskLevel: 'HIGH',
    totalIncidents: 8,
    criticalIncidents: 1,
    resolvedIncidents: 7,
    totalTransactionAmount: 12300000,
    violationsAmount: 520000,
    licenseStatus: 'VALID',
    documentationComplete: true,
    incidentsTrend: -5.8,
    riskTrend: -12.3,
    incidentsByCategory: [
      { category: 'Финансы', count: 5 },
      { category: 'Этика', count: 2 },
      { category: 'Комплаенс', count: 1 },
    ],
  },
  {
    vendorId: 'VENDOR-003',
    vendorName: 'ИП Смирнов А.А.',
    riskScore: 72,
    riskLevel: 'MEDIUM',
    totalIncidents: 6,
    criticalIncidents: 0,
    resolvedIncidents: 5,
    totalTransactionAmount: 4200000,
    violationsAmount: 180000,
    licenseStatus: 'EXPIRING',
    documentationComplete: true,
    incidentsTrend: 0,
    riskTrend: 3.2,
    incidentsByCategory: [
      { category: 'Качество данных', count: 3 },
      { category: 'Логистика', count: 2 },
      { category: 'Комплаенс', count: 1 },
    ],
  },
  {
    vendorId: 'VENDOR-004',
    vendorName: 'ООО "Альфа Поставка"',
    riskScore: 65,
    riskLevel: 'MEDIUM',
    totalIncidents: 5,
    criticalIncidents: 0,
    resolvedIncidents: 4,
    totalTransactionAmount: 8700000,
    violationsAmount: 240000,
    licenseStatus: 'VALID',
    documentationComplete: true,
    incidentsTrend: -8.5,
    riskTrend: -15.2,
    incidentsByCategory: [
      { category: 'Финансы', count: 3 },
      { category: 'Логистика', count: 2 },
    ],
  },
  {
    vendorId: 'VENDOR-005',
    vendorName: 'ЗАО "БетаТрейд"',
    riskScore: 58,
    riskLevel: 'MEDIUM',
    totalIncidents: 4,
    criticalIncidents: 0,
    resolvedIncidents: 3,
    totalTransactionAmount: 6500000,
    violationsAmount: 120000,
    licenseStatus: 'VALID',
    documentationComplete: true,
    incidentsTrend: -12.5,
    riskTrend: -8.7,
    incidentsByCategory: [
      { category: 'Комплаенс', count: 2 },
      { category: 'Качество данных', count: 2 },
    ],
  },
  {
    vendorId: 'VENDOR-006',
    vendorName: 'ООО "ДельтаСнаб"',
    riskScore: 42,
    riskLevel: 'LOW',
    totalIncidents: 2,
    criticalIncidents: 0,
    resolvedIncidents: 2,
    totalTransactionAmount: 3200000,
    violationsAmount: 0,
    licenseStatus: 'VALID',
    documentationComplete: true,
    incidentsTrend: 0,
    riskTrend: 0,
    incidentsByCategory: [
      { category: 'Логистика', count: 2 },
    ],
  },
];

export const analyticsHandlers = [
  // POST /analytics/summary - Получить сводку
  http.post(`${API_BASE_URL}/analytics/summary`, async ({ request }) => {
    await delay(500);
    const period = await request.json() as AnalyticsPeriod;
    console.log('📊 [MSW] Fetching dashboard summary for period:', period);
    
    const summary = generateDashboardSummary(period);
    return HttpResponse.json(summary);
  }),

  // POST /analytics/incident-trends - Получить тренды инцидентов
  http.post(`${API_BASE_URL}/analytics/incident-trends`, async ({ request }) => {
    await delay(600);
    const period = await request.json() as AnalyticsPeriod;
    console.log('📈 [MSW] Fetching incident trends for period:', period);
    
    const trends = generateIncidentTrends(period);
    return HttpResponse.json(trends);
  }),

  // POST /analytics/categories - Получить аналитику по категориям
  http.post(`${API_BASE_URL}/analytics/categories`, async ({ request }) => {
    await delay(500);
    const period = await request.json() as AnalyticsPeriod;
    console.log('📂 [MSW] Fetching category analytics for period:', period);
    
    return HttpResponse.json(mockCategoryAnalytics);
  }),

  // POST /analytics/manager-performance - Получить производительность менеджеров
  http.post(`${API_BASE_URL}/analytics/manager-performance`, async ({ request }) => {
    await delay(550);
    const period = await request.json() as AnalyticsPeriod;
    console.log('👥 [MSW] Fetching manager performance for period:', period);
    
    return HttpResponse.json(mockManagerPerformance);
  }),

  // POST /analytics/rule-performance - Получить эффективность правил
  http.post(`${API_BASE_URL}/analytics/rule-performance`, async ({ request }) => {
    await delay(500);
    const period = await request.json() as AnalyticsPeriod;
    console.log('⚙️ [MSW] Fetching rule performance for period:', period);
    
    return HttpResponse.json(mockRulePerformance);
  }),

  // POST /analytics/financial - Получить финансовую аналитику
  http.post(`${API_BASE_URL}/analytics/financial`, async ({ request }) => {
    await delay(600);
    const period = await request.json() as AnalyticsPeriod;
    console.log('💰 [MSW] Fetching financial analytics for period:', period);
    
    return HttpResponse.json(mockFinancialAnalytics);
  }),

  // POST /analytics/compliance - Получить аналитику комплаенса
  http.post(`${API_BASE_URL}/analytics/compliance`, async ({ request }) => {
    await delay(550);
    const period = await request.json() as AnalyticsPeriod;
    console.log('🛡️ [MSW] Fetching compliance analytics for period:', period);
    
    return HttpResponse.json(mockComplianceAnalytics);
  }),

  // POST /analytics/vendor-risk - Получить аналитику рисков поставщиков
  http.post(`${API_BASE_URL}/analytics/vendor-risk`, async ({ request }) => {
    await delay(600);
    const period = await request.json() as AnalyticsPeriod;
    console.log('🏢 [MSW] Fetching vendor risk analytics for period:', period);
    
    return HttpResponse.json(mockVendorRiskAnalytics);
  }),

  // POST /analytics/export-pdf - Экспорт отчета в PDF
  http.post(`${API_BASE_URL}/analytics/export-pdf`, async ({ request }) => {
    await delay(2000); // Имитация генерации PDF
    const options = await request.json() as ReportExportOptions;
    console.log('📥 [MSW] Exporting analytics report to PDF:', options);
    
    // Создать фиктивный PDF blob
    const pdfContent = `
Analytics Report
Period: ${options.period.label}
From: ${options.period.startDate}
To: ${options.period.endDate}

Sections included: ${options.sections.join(', ')}
Charts: ${options.includeCharts ? 'Yes' : 'No'}
Tables: ${options.includeTables ? 'Yes' : 'No'}
Details: ${options.includeDetails ? 'Yes' : 'No'}

This is a mock PDF report generated by MSW.
    `;
    
    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    return HttpResponse.json(blob);
  }),
];
