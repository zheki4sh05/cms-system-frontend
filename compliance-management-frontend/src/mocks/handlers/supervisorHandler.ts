// src/mocks/handlers_supervisor.ts

import { http, HttpResponse, delay } from 'msw';
import type {
  SupervisorDashboardStats,
  TeamKPI,
  VerificationQueue,
  ProblemArea,
  RuleEffectiveness,
  FinancialImpact,
  TrendData,
  CategoryDistribution,
  ApproveVerificationRequest,
} from '@shared/types/supervisorTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

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

// Моковые KPI команды
const mockTeamKPI: TeamKPI[] = [
  {
    managerId: '3',
    managerName: 'Иван Иванов',
    avatar: undefined,
    assignedIncidents: 45,
    resolvedIncidents: 42,
    activeCases: 8,
    completedCases: 7,
    avgResolutionTime: 28,
    falsePositiveRate: 5.2,
    onTimeCompletion: 94,
    performanceScore: 95,
    rank: 1,
  },
  {
    managerId: '4',
    managerName: 'Петр Петров',
    avatar: undefined,
    assignedIncidents: 38,
    resolvedIncidents: 34,
    activeCases: 6,
    completedCases: 5,
    avgResolutionTime: 32,
    falsePositiveRate: 7.1,
    onTimeCompletion: 89,
    performanceScore: 88,
    rank: 2,
  },
  {
    managerId: '5',
    managerName: 'Мария Сидорова',
    avatar: undefined,
    assignedIncidents: 42,
    resolvedIncidents: 37,
    activeCases: 7,
    completedCases: 6,
    avgResolutionTime: 35,
    falsePositiveRate: 9.5,
    onTimeCompletion: 86,
    performanceScore: 85,
    rank: 3,
  },
  {
    managerId: '6',
    managerName: 'Алексей Смирнов',
    avatar: undefined,
    assignedIncidents: 31,
    resolvedIncidents: 26,
    activeCases: 5,
    completedCases: 3,
    avgResolutionTime: 41,
    falsePositiveRate: 12.3,
    onTimeCompletion: 78,
    performanceScore: 72,
    rank: 4,
  },
];

// Моковая очередь верификации
let mockVerificationQueue: VerificationQueue[] = [
  {
    id: 'VER-001',
    type: 'ACTION_PLAN',
    title: 'План корректирующих действий: Превышение бюджета закупки',
    submittedBy: '3',
    submittedByName: 'Иван Иванов',
    submittedAt: '2024-12-02T16:30:00Z',
    priority: 'URGENT',
    caseId: 'CS-2024-001',
    actionPlanId: 'AP-2024-003',
    estimatedReviewTime: 15,
    severity: 'HIGH',
    taskCount: 5,
    completedTasks: 5,
  },
  {
    id: 'VER-002',
    type: 'CASE_CLOSURE',
    title: 'Закрытие случая: Дублирование записей поставщика',
    submittedBy: '4',
    submittedByName: 'Петр Петров',
    submittedAt: '2024-12-02T14:00:00Z',
    priority: 'NORMAL',
    caseId: 'CS-2024-002',
    estimatedReviewTime: 10,
    severity: 'MEDIUM',
    incidentCount: 1,
  },
  {
    id: 'VER-003',
    type: 'ACTION_PLAN',
    title: 'План корректирующих действий: Систематические задержки поставок',
    submittedBy: '5',
    submittedByName: 'Мария Сидорова',
    submittedAt: '2024-12-02T11:20:00Z',
    priority: 'HIGH',
    caseId: 'CS-2024-004',
    actionPlanId: 'AP-2024-001',
    estimatedReviewTime: 20,
    severity: 'MEDIUM',
    taskCount: 3,
    completedTasks: 1,
  },
  {
    id: 'VER-004',
    type: 'ACTION_PLAN',
    title: 'План корректирующих действий: Конфликт интересов',
    submittedBy: '3',
    submittedByName: 'Иван Иванов',
    submittedAt: '2024-12-01T18:45:00Z',
    priority: 'URGENT',
    caseId: 'CS-2024-003',
    actionPlanId: 'AP-2024-004',
    estimatedReviewTime: 25,
    severity: 'CRITICAL',
    taskCount: 7,
    completedTasks: 7,
  },
  {
    id: 'VER-005',
    type: 'CASE_CLOSURE',
    title: 'Закрытие случая: Изменение цен после согласования',
    submittedBy: '6',
    submittedByName: 'Алексей Смирнов',
    submittedAt: '2024-12-01T15:10:00Z',
    priority: 'NORMAL',
    caseId: 'CS-2024-006',
    estimatedReviewTime: 8,
    severity: 'HIGH',
    incidentCount: 2,
  },
];

// Моковые проблемные зоны
const mockProblemAreas: ProblemArea[] = [
  {
    id: 'PROB-001',
    category: 'Финансовый контроль',
    title: 'Рост случаев превышения бюджета на 23%',
    description: 'За последний месяц количество случаев превышения утвержденного бюджета выросло на 23%. Основная причина - изменение цен поставщиками после согласования.',
    severity: 'CRITICAL',
    affectedIncidents: 12,
    affectedCases: 4,
    estimatedImpact: 'Финансовые потери ~2.5 млн руб/месяц, репутационные риски',
    trend: 'WORSENING',
    trendPercentage: 23,
    recommendations: [
      'Внедрить механизм фиксации цен в договорах',
      'Автоматизировать контроль изменения цен',
      'Провести обучение менеджеров по закупкам',
      'Пересмотреть процесс согласования бюджета',
    ],
  },
  {
    id: 'PROB-002',
    category: 'Качество данных',
    title: 'Систематические дубликаты контрагентов',
    description: 'Обнаружено 15 случаев дублирования записей контрагентов за месяц. Проблема связана с ручным вводом данных разными сотрудниками.',
    severity: 'MEDIUM',
    affectedIncidents: 15,
    affectedCases: 2,
    estimatedImpact: 'Ошибки в отчетности, затраты времени на исправление, риск неправильных платежей',
    trend: 'STABLE',
    trendPercentage: 0,
    recommendations: [
      'Внедрить автоматическую проверку на дубликаты при создании',
      'Использовать API ЕГРЮЛ для автозаполнения данных',
      'Централизовать управление справочником контрагентов',
    ],
  },
  {
    id: 'PROB-003',
    category: 'Комплаенс',
    title: 'Недостаточный контроль лицензий поставщиков',
    description: 'Выявлено 8 случаев работы с поставщиками с истекшими или отсутствующими лицензиями. Риск штрафов от регуляторов.',
    severity: 'HIGH',
    affectedIncidents: 8,
    affectedCases: 3,
    estimatedImpact: 'Юридические риски, штрафы до 500 тыс руб, приостановка операций',
    trend: 'IMPROVING',
    trendPercentage: -15,
    recommendations: [
      'Автоматизировать мониторинг сроков действия лицензий',
      'Внедрить уведомления за 30 дней до истечения',
      'Создать реестр обязательных лицензий по категориям',
    ],
  },
  {
    id: 'PROB-004',
    category: 'Логистика',
    title: 'Высокий процент задержек поставок (18%)',
    description: 'У 18% поставщиков наблюдаются систематические задержки поставок. Средняя задержка составляет 4.2 дня.',
    severity: 'MEDIUM',
    affectedIncidents: 23,
    affectedCases: 5,
    estimatedImpact: 'Срыв производственных планов, издержки на срочные закупки',
    trend: 'WORSENING',
    trendPercentage: 12,
    recommendations: [
      'Провести аудит надежности поставщиков',
      'Создать резервный список поставщиков',
      'Внедрить штрафные санкции в договоры',
      'Оптимизировать страховой запас',
    ],
  },
  {
    id: 'PROB-005',
    category: 'Процессы',
    title: 'Высокий процент ложных срабатываний правил (12%)',
    description: 'Некоторые правила генерируют слишком много ложных срабатываний, что снижает эффективность команды.',
    severity: 'LOW',
    affectedIncidents: 19,
    affectedCases: 0,
    estimatedImpact: 'Потеря времени команды ~120 часов/месяц, снижение доверия к системе',
    trend: 'IMPROVING',
    trendPercentage: -8,
    recommendations: [
      'Провести ревизию правил с точностью ниже 85%',
      'Настроить пороговые значения правил',
      'Внедрить механизм обучения правил на исторических данных',
    ],
  },
];

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

  // GET /supervisor/team/kpi - Получить KPI команды
  http.get(`${API_BASE_URL}/supervisor/team/kpi`, async () => {
    await delay(500);
    console.log('👥 [MSW] Fetching team KPI');
    return HttpResponse.json(mockTeamKPI);
  }),

  // GET /supervisor/verification/queue - Получить очередь верификации
  http.get(`${API_BASE_URL}/supervisor/verification/queue`, async () => {
    await delay(400);
    console.log('✅ [MSW] Fetching verification queue');
    return HttpResponse.json(mockVerificationQueue);
  }),

  // PUT /supervisor/verification/:itemId/process - Обработать верификацию
  http.put(`${API_BASE_URL}/supervisor/verification/:itemId/process`, async ({ request, params }) => {
    await delay(600);
    const { itemId } = params;
    const body = await request.json() as ApproveVerificationRequest;
    console.log(`✅ [MSW] Processing verification ${itemId}:`, body);
    
    // Удалить элемент из очереди
    mockVerificationQueue = mockVerificationQueue.filter(item => item.id !== itemId);
    
    return HttpResponse.json({ message: body.approved ? 'Утверждено' : 'Отклонено' });
  }),

  // GET /supervisor/analytics/problem-areas - Получить проблемные зоны
  http.get(`${API_BASE_URL}/supervisor/analytics/problem-areas`, async () => {
    await delay(500);
    console.log('⚠️ [MSW] Fetching problem areas');
    return HttpResponse.json(mockProblemAreas);
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
