// src/mocks/handlers_supervisor.ts

import { http, HttpResponse, delay } from 'msw';
import type { IncidentProblemAreasResponse } from '@shared/types/incidentTypes';
import type {
  SupervisorDashboardStats,
  PendingVerificationItem,
  RuleEffectiveness,
  FinancialImpact,
  TrendData,
  CategoryDistribution,
  ApproveVerificationRequest,
} from '@shared/types/supervisorTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// Моковые данные статистики
const mockDashboardStats: SupervisorDashboardStats = {
  totalIncidents: 156,
  totalCases: 23,
  totalActionPlans: 12,
  
  incidentsTrend: 8.5, // +8.5% за период
  casesTrend: -5.2, // -5.2% (улучшение)
  resolutionTimeTrend: -12.3, // -12.3% (улучшение - быстрее решаем)
  
  criticalIncidents: 4,
  overdueActionPlans: 2,
  pendingVerifications: 5,
  
  avgResolutionTime: 36,
  falsePositiveRate: 8.5,
  escalationRate: 14.7,
};

// GET /api/supervisor/verification/pending
let mockPendingVerifications: PendingVerificationItem[] = [
  {
    actionPlanId: 'AP-2024-003',
    incidentId: 'INC-2024-156',
    documentTitle: 'Договор поставки №123 / Превышение бюджета закупки',
    responsible: {
      userId: '3',
      employeeId: 'emp-3',
      firstName: 'Иван',
      lastName: 'Иванов',
    },
    incidentReceivedAt: '2024-12-01T11:00:00Z',
  },
  {
    actionPlanId: 'AP-2024-007',
    incidentId: 'INC-2024-160',
    documentTitle: null,
    responsible: {
      userId: '4',
      employeeId: null,
      firstName: 'Пётр',
      lastName: 'Петров',
    },
    incidentReceivedAt: '2024-12-02T14:00:00Z',
  },
  {
    actionPlanId: 'AP-2024-001',
    incidentId: 'INC-2024-158',
    documentTitle: 'Спецификация к тендеру',
    responsible: {
      userId: '5',
      employeeId: 'emp-5',
      firstName: 'Мария',
      lastName: 'Сидорова',
    },
    incidentReceivedAt: '2024-12-02T11:20:00Z',
  },
  {
    actionPlanId: 'AP-2024-004',
    incidentId: 'INC-2024-157',
    documentTitle: 'Акт сверки с контрагентом',
    responsible: {
      userId: '3',
      employeeId: 'emp-3',
      firstName: 'Иван',
      lastName: 'Иванов',
    },
    incidentReceivedAt: '2024-12-01T18:45:00Z',
  },
];

// GET /api/incidents/problem-areas
const mockProblemAreasResponseBase: IncidentProblemAreasResponse = {
  month: '2026-05',
  groups: [
    {
      documentId: 'DOC-123',
      incidentCount: 3,
      incidents: [
        {
          incident: {
            id: 'INC-PA-101',
            companyId: 'company-1',
            integrationId: 1,
            riskObjectId: 'RO-Z-01',
            riskObjectName: 'Закупка комплектующих №4421',
            documentId: 'DOC-123',
            integrationName: 'ERP Закупки',
            status: 'PARTLY_PROGRESS',
          },
          findings: [
            {
              id: 'F-PA-1',
              priority: 'HIGH',
              assignedUserId: undefined,
              ruleName: 'Превышение лимита без согласования',
              details: {},
              cases: [
                {
                  id: 'CS-PA-001',
                  incidentId: 'INC-PA-101',
                  findingId: 'F-PA-1',
                  assignedUserId: undefined,
                  status: 'WAITING_VERIFICATION',
                  comments: [],
                  attachments: [],
                },
              ],
            },
          ],
        },
        {
          incident: {
            id: 'INC-PA-102',
            companyId: 'company-1',
            integrationId: 1,
            riskObjectId: 'RO-Z-01',
            riskObjectName: 'Закупка комплектующих №4421',
            documentId: 'DOC-123',
            integrationName: 'ERP Закупки',
            status: 'IN_REVIEW',
          },
          findings: [
            {
              id: 'F-PA-2',
              priority: 'MEDIUM',
              ruleName: 'Изменение цен после согласования',
              details: {},
              cases: [
                {
                  id: 'CS-PA-002',
                  incidentId: 'INC-PA-102',
                  findingId: 'F-PA-2',
                  status: 'IN_PROGRESS',
                  comments: [],
                  attachments: [],
                },
              ],
            },
          ],
        },
        {
          incident: {
            id: 'INC-PA-103',
            companyId: 'company-1',
            integrationId: 1,
            riskObjectId: 'RO-Z-02',
            riskObjectName: 'Спецификация к тендеру',
            documentId: 'DOC-123',
            integrationName: 'ERP Закупки',
            status: 'RESOLVED',
          },
          findings: [
            {
              id: 'F-PA-3',
              priority: 'LOW',
              ruleName: 'Превышение лимита без согласования',
              details: {},
              cases: [],
            },
          ],
        },
      ],
    },
    {
      documentId: 'DOC-774',
      incidentCount: 2,
      incidents: [
        {
          incident: {
            id: 'INC-PA-201',
            companyId: 'company-1',
            integrationId: 2,
            riskObjectId: 'RO-S-09',
            riskObjectName: 'Договор поставки Alfa',
            documentId: 'DOC-774',
            integrationName: 'DMS',
            status: 'ASSIGNED',
          },
          findings: [
            {
              id: 'F-PA-201',
              priority: 'HIGH',
              ruleName: 'Конфликт интересов при закупках',
              details: {},
              cases: [],
            },
          ],
        },
        {
          incident: {
            id: 'INC-PA-202',
            companyId: 'company-1',
            integrationId: 2,
            riskObjectId: 'RO-S-09',
            riskObjectName: 'Договор поставки Alfa',
            documentId: 'DOC-774',
            integrationName: 'DMS',
            status: 'NEW',
          },
          findings: [
            {
              id: 'F-PA-202',
              priority: 'HIGH',
              ruleName: 'Конфликт интересов при закупках',
              details: {},
              cases: [],
            },
          ],
        },
      ],
    },
  ],
};

// Моковая эффективность правил
const mockRuleEffectiveness: RuleEffectiveness[] = [
  {
    ruleId: 'RULE-001',
    ruleName: 'Конфликт интересов при закупках',
    category: 'Этика',
    totalTriggers: 8,
    truePositives: 8,
    falsePositives: 0,
    accuracy: 100,
    avgResolutionTime: 48,
    status: 'ACTIVE',
    lastModified: '2024-11-15T10:00:00Z',
  },
  {
    ruleId: 'RULE-002',
    ruleName: 'Превышение лимита без согласования',
    category: 'Финансы',
    totalTriggers: 45,
    truePositives: 41,
    falsePositives: 4,
    accuracy: 91,
    avgResolutionTime: 24,
    status: 'ACTIVE',
    lastModified: '2024-10-20T14:30:00Z',
  },
  {
    ruleId: 'RULE-003',
    ruleName: 'Истекшая лицензия поставщика',
    category: 'Комплаенс',
    totalTriggers: 12,
    truePositives: 11,
    falsePositives: 1,
    accuracy: 92,
    avgResolutionTime: 18,
    status: 'ACTIVE',
    lastModified: '2024-09-10T09:00:00Z',
  },
  {
    ruleId: 'RULE-004',
    ruleName: 'Систематическое нарушение сроков',
    category: 'Логистика',
    totalTriggers: 28,
    truePositives: 23,
    falsePositives: 5,
    accuracy: 82,
    avgResolutionTime: 36,
    status: 'UNDER_REVIEW',
    lastModified: '2024-11-25T16:00:00Z',
  },
  {
    ruleId: 'RULE-005',
    ruleName: 'Дубликаты контрагентов',
    category: 'Качество данных',
    totalTriggers: 19,
    truePositives: 15,
    falsePositives: 4,
    accuracy: 79,
    avgResolutionTime: 12,
    status: 'UNDER_REVIEW',
    lastModified: '2024-11-01T11:30:00Z',
  },
  {
    ruleId: 'RULE-006',
    ruleName: 'Изменение цен после согласования',
    category: 'Финансы',
    totalTriggers: 34,
    truePositives: 30,
    falsePositives: 4,
    accuracy: 88,
    avgResolutionTime: 28,
    status: 'ACTIVE',
    lastModified: '2024-10-05T13:00:00Z',
  },
  {
    ruleId: 'RULE-007',
    ruleName: 'Нарушение требований по НДС',
    category: 'Комплаенс',
    totalTriggers: 7,
    truePositives: 5,
    falsePositives: 2,
    accuracy: 71,
    avgResolutionTime: 22,
    status: 'UNDER_REVIEW',
    lastModified: '2024-11-10T10:15:00Z',
  },
  {
    ruleId: 'RULE-008',
    ruleName: 'Превышение рыночной цены',
    category: 'Финансы',
    totalTriggers: 23,
    truePositives: 14,
    falsePositives: 9,
    accuracy: 61,
    avgResolutionTime: 16,
    status: 'DISABLED',
    lastModified: '2024-11-28T15:45:00Z',
  },
];

// Моковое финансовое влияние
const mockFinancialImpact: FinancialImpact = {
  period: 'Ноябрь 2024',
  detectedViolationsAmount: 8450000,
  preventedLosses: 6230000,
  systemCosts: 450000,
  savings: 5780000,
  roi: 1284,
  byCategory: [
    { category: 'Финансы', amount: 4850000, percentage: 57 },
    { category: 'Комплаенс', amount: 1920000, percentage: 23 },
    { category: 'Логистика', amount: 1240000, percentage: 15 },
    { category: 'Этика', amount: 440000, percentage: 5 },
  ],
};

// Моковое распределение по категориям
const mockCategoryDistribution: CategoryDistribution[] = [
  { category: 'Финансы', count: 58, percentage: 37, trend: 8.5 },
  { category: 'Комплаенс', count: 34, percentage: 22, trend: -5.2 },
  { category: 'Логистика', count: 28, percentage: 18, trend: 12.3 },
  { category: 'Качество данных', count: 21, percentage: 13, trend: 0 },
  { category: 'Этика', count: 10, percentage: 6, trend: -15.8 },
  { category: 'Контрагенты', count: 5, percentage: 4, trend: 3.2 },
];

export const supervisorHandlers = [
  // GET /supervisor/dashboard/stats - Получить статистику панели
  http.get(`${API_BASE_URL}/supervisor/dashboard/stats`, async () => {
    await delay(400);
    console.log('📊 [MSW] Fetching supervisor dashboard stats');
    return HttpResponse.json(mockDashboardStats);
  }),

  // GET /api/supervisor/verification/pending
  http.get(`${API_ROOT}/api/supervisor/verification/pending`, async () => {
    await delay(400);
    console.log('✅ [MSW] Fetching pending verifications');
    return HttpResponse.json({ items: mockPendingVerifications });
  }),

  // PUT /api/supervisor/verification/:actionPlanId
  http.put(`${API_ROOT}/api/supervisor/verification/:actionPlanId`, async ({ request, params }) => {
    await delay(600);
    const actionPlanId = String(params.actionPlanId);
    const body = await request.json() as ApproveVerificationRequest;
    console.log(`✅ [MSW] Processing verification ${actionPlanId}:`, body);

    mockPendingVerifications = mockPendingVerifications.filter((item) => item.actionPlanId !== actionPlanId);

    return HttpResponse.json({ message: body.approved ? 'Утверждено' : 'Отклонено' });
  }),

  // GET /api/incidents/problem-areas
  http.get(`${API_ROOT}/api/incidents/problem-areas`, async ({ request }) => {
    await delay(450);
    const url = new URL(request.url);
    const monthParam = url.searchParams.get('month');
    const month =
      monthParam && /^\d{4}-\d{2}$/.test(monthParam)
        ? monthParam
        : mockProblemAreasResponseBase.month;
    console.log(`⚠️ [MSW] Fetching incident problem areas, month=${month}`);
    return HttpResponse.json({
      ...mockProblemAreasResponseBase,
      month,
    });
  }),

  // GET /supervisor/analytics/rule-effectiveness - Получить эффективность правил
  http.get(`${API_BASE_URL}/supervisor/analytics/rule-effectiveness`, async () => {
    await delay(450);
    console.log('📈 [MSW] Fetching rule effectiveness');
    return HttpResponse.json(mockRuleEffectiveness);
  }),

  // GET /supervisor/analytics/financial-impact - Получить финансовое влияние
  http.get(`${API_BASE_URL}/supervisor/analytics/financial-impact`, async () => {
    await delay(400);
    console.log('💰 [MSW] Fetching financial impact');
    return HttpResponse.json(mockFinancialImpact);
  }),

  // GET /supervisor/analytics/trends - Получить данные трендов
  http.get(`${API_BASE_URL}/supervisor/analytics/trends`, async ({ request }) => {
    await delay(500);
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || 'week';
    console.log(`📉 [MSW] Fetching trends for period: ${period}`);
    
    // Генерация моковых данных трендов
    const trendData: TrendData[] = [];
    const days = period === 'week' ? 7 : period === 'month' ? 30 : 90;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendData.push({
        date: date.toISOString().split('T')[0],
        incidents: Math.floor(Math.random() * 10) + 5,
        cases: Math.floor(Math.random() * 3) + 1,
        resolved: Math.floor(Math.random() * 8) + 3,
      });
    }
    
    return HttpResponse.json(trendData);
  }),

  // GET /supervisor/analytics/categories - Получить распределение по категориям
  http.get(`${API_BASE_URL}/supervisor/analytics/categories`, async () => {
    await delay(400);
    console.log('📊 [MSW] Fetching category distribution');
    return HttpResponse.json(mockCategoryDistribution);
  }),

  // GET /supervisor/reports/export - Экспорт отчета
  http.get(`${API_BASE_URL}/supervisor/reports/export`, async ({ request }) => {
    await delay(1000);
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'pdf';
    const period = url.searchParams.get('period') || 'current_month';
    console.log(`📥 [MSW] Exporting report: ${format}, period: ${period}`);
    
    // Создать фиктивный blob для демонстрации
    const content = `Mock ${format.toUpperCase()} Report - ${period}`;
    const blob = new Blob([content], { 
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    return HttpResponse.json(blob);
  }),
];
