// src/mocks/handlers_strategic.ts

import { http, HttpResponse, delay } from 'msw';
import type {
  StrategicDashboard,
  AnalyticsPeriod,
  StrategicKPI,
  StrategicInsight,
  ExportReportOptions,
  KPICategory,
} from '@shared/types/strategicTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Генерация истории KPI
const generateKPIHistory = (currentValue: number, months: number = 6): any[] => {
  const history = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const variance = (Math.random() - 0.5) * 0.2; // ±10% вариация
    const value = Math.round(currentValue * (1 + variance));
    const target = Math.round(currentValue * 1.05);
    
    history.push({
      date: date.toISOString().split('T')[0],
      value,
      target,
    });
  }
  
  return history;
};

// Моковые данные стратегической панели
const generateStrategicDashboard = (period: AnalyticsPeriod): StrategicDashboard => {
  return {
    period,
    lastUpdated: new Date().toISOString(),
    
    // Ключевые KPI
    kpis: [
      {
        id: 'KPI-001',
        name: 'Предотвращенные убытки',
        description: 'Общая сумма предотвращенных финансовых потерь благодаря системе контроля',
        category: 'FINANCIAL',
        currentValue: 18500000,
        targetValue: 20000000,
        unit: '₽',
        previousValue: 16200000,
        change: 2300000,
        changePercent: 14.2,
        trend: 'UP',
        status: 'GOOD',
        achievement: 92.5,
        history: generateKPIHistory(18500000, 6),
      },
      {
        id: 'KPI-002',
        name: 'ROI системы',
        description: 'Возврат инвестиций в систему контроля закупок',
        category: 'FINANCIAL',
        currentValue: 1284,
        targetValue: 1200,
        unit: '%',
        previousValue: 1150,
        change: 134,
        changePercent: 11.7,
        trend: 'UP',
        status: 'EXCELLENT',
        achievement: 107,
        history: generateKPIHistory(1284, 6),
      },
      {
        id: 'KPI-003',
        name: 'Эффективность системы',
        description: 'Общая эффективность работы системы контроля',
        category: 'EFFICIENCY',
        currentValue: 87,
        targetValue: 90,
        unit: '%',
        previousValue: 83,
        change: 4,
        changePercent: 4.8,
        trend: 'UP',
        status: 'GOOD',
        achievement: 96.7,
        history: generateKPIHistory(87, 6),
      },
      {
        id: 'KPI-004',
        name: 'Уровень комплаенса',
        description: 'Соответствие нормативным требованиям и внутренним стандартам',
        category: 'COMPLIANCE',
        currentValue: 93,
        targetValue: 95,
        unit: '%',
        previousValue: 91,
        change: 2,
        changePercent: 2.2,
        trend: 'UP',
        status: 'GOOD',
        achievement: 97.9,
        history: generateKPIHistory(93, 6),
      },
      {
        id: 'KPI-005',
        name: 'Точность обнаружения',
        description: 'Процент правильно выявленных нарушений',
        category: 'QUALITY',
        currentValue: 89,
        targetValue: 92,
        unit: '%',
        previousValue: 86,
        change: 3,
        changePercent: 3.5,
        trend: 'UP',
        status: 'GOOD',
        achievement: 96.7,
        history: generateKPIHistory(89, 6),
      },
      {
        id: 'KPI-006',
        name: 'Время реакции',
        description: 'Среднее время от обнаружения до начала расследования',
        category: 'OPERATIONAL',
        currentValue: 4.2,
        targetValue: 4.0,
        unit: 'ч',
        previousValue: 5.1,
        change: -0.9,
        changePercent: -17.6,
        trend: 'DOWN',
        status: 'GOOD',
        achievement: 95.2,
        history: generateKPIHistory(4.2, 6),
      },
      {
        id: 'KPI-007',
        name: 'Уровень автоматизации',
        description: 'Процент автоматически обработанных проверок',
        category: 'EFFICIENCY',
        currentValue: 78,
        targetValue: 85,
        unit: '%',
        previousValue: 72,
        change: 6,
        changePercent: 8.3,
        trend: 'UP',
        status: 'WARNING',
        achievement: 91.8,
        history: generateKPIHistory(78, 6),
      },
      {
        id: 'KPI-008',
        name: 'Уровень риска',
        description: 'Общий уровень риска в закупках (чем ниже, тем лучше)',
        category: 'RISK',
        currentValue: 32,
        targetValue: 25,
        unit: '/100',
        previousValue: 38,
        change: -6,
        changePercent: -15.8,
        trend: 'DOWN',
        status: 'GOOD',
        achievement: 78.1,
        history: generateKPIHistory(32, 6),
      },
    ],
    
    // Финансовые метрики
    financial: {
      totalViolationsDetected: 456,
      violationsAmount: 25300000,
      violationsTrend: 8.5,
      
      preventedLosses: 18500000,
      preventedLossesTrend: 14.2,
      
      recoveredAmount: 5800000,
      recoveredAmountTrend: 23.5,
      
      systemROI: 1284,
      systemROITrend: 11.7,
      
      systemCosts: 1890000,
      totalSavings: 24300000,
      
      byCategory: [
        {
          category: 'Финансовые нарушения',
          amount: 14500000,
          count: 178,
          percentage: 57,
          trend: 12.3,
        },
        {
          category: 'Комплаенс',
          amount: 5800000,
          count: 102,
          percentage: 23,
          trend: -5.2,
        },
        {
          category: 'Этические нарушения',
          amount: 3200000,
          count: 45,
          percentage: 13,
          trend: 34.5,
        },
        {
          category: 'Логистика',
          amount: 1800000,
          count: 131,
          percentage: 7,
          trend: 8.7,
        },
      ],
      
      monthlyDynamics: [
        { month: 'Июль', violations: 19200000, prevented: 14800000, recovered: 3200000, roi: 1180 },
        { month: 'Август', violations: 21500000, prevented: 15900000, recovered: 4100000, roi: 1220 },
        { month: 'Сентябрь', violations: 22100000, prevented: 16800000, recovered: 4800000, roi: 1245 },
        { month: 'Октябрь', violations: 23800000, prevented: 17200000, recovered: 5200000, roi: 1260 },
        { month: 'Ноябрь', violations: 24500000, prevented: 17900000, recovered: 5500000, roi: 1270 },
        { month: 'Декабрь', violations: 25300000, prevented: 18500000, recovered: 5800000, roi: 1284 },
      ],
      
      forecast: {
        nextQuarterPrevented: 22500000,
        nextQuarterROI: 1350,
        yearEndProjection: 95000000,
        confidence: 87,
      },
    },
    
    // Производительность системы
    systemPerformance: {
      overallEfficiency: 87,
      efficiencyTrend: 4.8,
      
      detectionAccuracy: 89,
      accuracyTrend: 3.5,
      
      avgProcessingTime: 4.2,
      processingTimeTrend: -17.6,
      
      systemLoad: 72,
      
      activeRules: 18,
      totalRules: 24,
      activeUsers: 45,
      totalUsers: 52,
      
      incidentsProcessed: 456,
      incidentsResolved: 398,
      avgResolutionTime: 36,
      resolutionRate: 87,
      
      topPerformingRules: [
        {
          ruleId: 'RULE-001',
          ruleName: 'Конфликт интересов при закупках',
          accuracy: 100,
          triggers: 28,
          impact: 3200000,
        },
        {
          ruleId: 'RULE-002',
          ruleName: 'Превышение лимита без согласования',
          accuracy: 94,
          triggers: 145,
          impact: 8500000,
        },
        {
          ruleId: 'RULE-003',
          ruleName: 'Изменение цен после согласования',
          accuracy: 92,
          triggers: 89,
          impact: 4200000,
        },
      ],
      
      underperformingRules: [
        {
          ruleId: 'RULE-008',
          ruleName: 'Превышение рыночной цены',
          accuracy: 61,
          triggers: 67,
          impact: 1200000,
        },
        {
          ruleId: 'RULE-007',
          ruleName: 'Нарушение требований по НДС',
          accuracy: 71,
          triggers: 23,
          impact: 580000,
        },
      ],
    },
    
    // Метрики рисков
    riskMetrics: {
      overallRiskLevel: 32,
      riskTrend: -15.8,
      riskStatus: 'MEDIUM',
      
      criticalRisks: 3,
      highRisks: 12,
      mediumRisks: 28,
      lowRisks: 15,
      
      risksByCategory: [
        {
          category: 'Финансовые риски',
          level: 'MEDIUM',
          score: 45,
          incidents: 178,
          trend: -8.5,
        },
        {
          category: 'Операционные риски',
          level: 'LOW',
          score: 28,
          incidents: 131,
          trend: -12.3,
        },
        {
          category: 'Комплаенс риски',
          level: 'MEDIUM',
          score: 35,
          incidents: 102,
          trend: 5.2,
        },
        {
          category: 'Репутационные риски',
          level: 'HIGH',
          score: 58,
          incidents: 45,
          trend: 15.7,
        },
      ],
      
      topRiskyVendors: [
        {
          vendorId: 'VENDOR-001',
          vendorName: 'ООО "Гамма Логистика"',
          riskScore: 85,
          riskLevel: 'HIGH',
          incidents: 12,
          totalAmount: 15600000,
        },
        {
          vendorId: 'VENDOR-002',
          vendorName: 'ООО "Техноком"',
          riskScore: 78,
          riskLevel: 'HIGH',
          incidents: 8,
          totalAmount: 12300000,
        },
        {
          vendorId: 'VENDOR-003',
          vendorName: 'ИП Смирнов А.А.',
          riskScore: 72,
          riskLevel: 'MEDIUM',
          incidents: 6,
          totalAmount: 4200000,
        },
        {
          vendorId: 'VENDOR-004',
          vendorName: 'ООО "Альфа Поставка"',
          riskScore: 65,
          riskLevel: 'MEDIUM',
          incidents: 5,
          totalAmount: 8700000,
        },
        {
          vendorId: 'VENDOR-005',
          vendorName: 'ЗАО "БетаТрейд"',
          riskScore: 58,
          riskLevel: 'MEDIUM',
          incidents: 4,
          totalAmount: 6500000,
        },
      ],
      
      complianceScore: 93,
      complianceTrend: 2.2,
      complianceViolations: 87,
      
      riskMap: [
        { category: 'Финансовое мошенничество', probability: 45, impact: 85, level: 'HIGH' },
        { category: 'Конфликт интересов', probability: 25, impact: 90, level: 'MEDIUM' },
        { category: 'Нарушение комплаенса', probability: 35, impact: 60, level: 'MEDIUM' },
        { category: 'Ненадежные поставщики', probability: 55, impact: 45, level: 'MEDIUM' },
        { category: 'Превышение бюджета', probability: 65, impact: 70, level: 'HIGH' },
        { category: 'Качество данных', probability: 40, impact: 35, level: 'LOW' },
      ],
    },
    
    // Операционные метрики
    operational: {
      teamEfficiency: 84,
      teamEfficiencyTrend: 6.5,
      
      avgManagerWorkload: 78,
      workloadBalance: 85,
      
      activeCases: 34,
      closedCases: 189,
      caseClosureRate: 84.8,
      
      slaCompliance: 91,
      slaBreaches: 12,
      
      automationRate: 78,
      automationTrend: 8.3,
      
      managerPerformance: [
        {
          managerId: '3',
          managerName: 'Иван Иванов',
          efficiency: 94,
          workload: 85,
          completionRate: 96,
          avgResolutionTime: 28,
        },
        {
          managerId: '4',
          managerName: 'Петр Петров',
          efficiency: 89,
          workload: 82,
          completionRate: 91,
          avgResolutionTime: 32,
        },
        {
          managerId: '5',
          managerName: 'Мария Сидорова',
          efficiency: 86,
          workload: 78,
          completionRate: 88,
          avgResolutionTime: 35,
        },
        {
          managerId: '6',
          managerName: 'Алексей Смирнов',
          efficiency: 78,
          workload: 68,
          completionRate: 82,
          avgResolutionTime: 41,
        },
        {
          managerId: '7',
          managerName: 'Ольга Кузнецова',
          efficiency: 92,
          workload: 88,
          completionRate: 94,
          avgResolutionTime: 30,
        },
      ],
    },
    
    // Тренды
    trends: [
      {
        metric: 'Предотвращенные убытки',
        category: 'FINANCIAL',
        currentValue: 18500000,
        trend: 'INCREASING',
        changeRate: 14.2,
        prediction: 22500000,
        significance: 'HIGH',
        insights: [
          'Постоянный рост на протяжении последних 6 месяцев',
          'Основной вклад от правил финансового контроля',
          'Ожидается продолжение тренда в следующем квартале',
        ],
      },
      {
        metric: 'Точность обнаружения',
        category: 'QUALITY',
        currentValue: 89,
        trend: 'INCREASING',
        changeRate: 3.5,
        prediction: 92,
        significance: 'MEDIUM',
        insights: [
          'Улучшение благодаря оптимизации правил',
          'Снижение количества ложных срабатываний',
          'Дополнительное обучение команды даст еще +3%',
        ],
      },
      {
        metric: 'Уровень риска',
        category: 'RISK',
        currentValue: 32,
        trend: 'DECREASING',
        changeRate: -15.8,
        prediction: 25,
        significance: 'HIGH',
        insights: [
          'Значительное снижение общего уровня риска',
          'Эффективная работа с проблемными поставщиками',
          'Целевой показатель может быть достигнут к концу квартала',
        ],
      },
    ],
  };
};

// Моковые стратегические инсайты
const mockInsights: StrategicInsight[] = [
  {
    id: 'INS-001',
    type: 'OPPORTUNITY',
    priority: 'HIGH',
    title: 'Возможность увеличения ROI на 15%',
    description: 'Внедрение дополнительных правил контроля в категории "Финансовые нарушения" может увеличить ROI системы с 1284% до 1480%',
    impact: 'Дополнительная экономия до 3.5 млн руб. в квартал',
    actionItems: [
      'Разработать 3 новых правила для категории финансового контроля',
      'Провести пилотное тестирование на исторических данных',
      'Внедрить правила с постепенным увеличением охвата',
    ],
    affectedKPIs: ['KPI-001', 'KPI-002'],
    createdAt: '2024-12-01T10:00:00Z',
  },
  {
    id: 'INS-002',
    type: 'THREAT',
    priority: 'HIGH',
    title: 'Рост репутационных рисков',
    description: 'Увеличение количества этических нарушений на 34.5% за последний период. Необходимо принять срочные меры.',
    impact: 'Потенциальный ущерб репутации и возможные юридические последствия',
    actionItems: [
      'Провести внеплановый аудит процедур закупок',
      'Усилить контроль конфликтов интересов',
      'Организовать обучение сотрудников по этическим стандартам',
      'Внедрить дополнительные проверки для высокорисковых операций',
    ],
    affectedKPIs: ['KPI-008', 'KPI-004'],
    createdAt: '2024-12-02T14:30:00Z',
  },
  {
    id: 'INS-003',
    type: 'RECOMMENDATION',
    priority: 'MEDIUM',
    title: 'Оптимизация загрузки команды',
    description: 'Неравномерная загрузка менеджеров (от 68% до 88%). Перераспределение задач может повысить общую эффективность на 8%.',
    impact: 'Улучшение эффективности команды и снижение времени обработки инцидентов',
    actionItems: [
      'Проанализировать распределение задач между менеджерами',
      'Внедрить автоматическое балансирование нагрузки',
      'Предоставить дополнительное обучение менеджерам с низкой эффективностью',
    ],
    affectedKPIs: ['KPI-003', 'KPI-006'],
    createdAt: '2024-12-01T16:45:00Z',
  },
  {
    id: 'INS-004',
    type: 'ALERT',
    priority: 'MEDIUM',
    title: 'Целевой показатель автоматизации под угрозой',
    description: 'Текущий уровень автоматизации 78% при целевом 85%. Для достижения цели необходимы дополнительные меры.',
    impact: 'Риск не достижения годовых KPI по автоматизации',
    actionItems: [
      'Идентифицировать процессы с потенциалом автоматизации',
      'Разработать дополнительные автоматические правила',
      'Оптимизировать существующие процессы обработки',
    ],
    affectedKPIs: ['KPI-007'],
    createdAt: '2024-12-03T09:20:00Z',
  },
  {
    id: 'INS-005',
    type: 'OPPORTUNITY',
    priority: 'MEDIUM',
    title: 'Потенциал улучшения работы с проблемными поставщиками',
    description: 'Топ-5 рисковых поставщиков составляют 47% всех инцидентов. Целенаправленная работа с ними может снизить риски на 20%.',
    impact: 'Снижение общего уровня риска и количества инцидентов',
    actionItems: [
      'Разработать индивидуальные планы работы с каждым рисковым поставщиком',
      'Усилить мониторинг операций с высокорисковыми контрагентами',
      'Рассмотреть возможность замены наиболее проблемных поставщиков',
    ],
    affectedKPIs: ['KPI-008', 'KPI-005'],
    createdAt: '2024-11-30T11:15:00Z',
  },
  {
    id: 'INS-006',
    type: 'RECOMMENDATION',
    priority: 'LOW',
    title: 'Повышение точности правила "Превышение рыночной цены"',
    description: 'Правило показывает точность только 61%. Доработка алгоритма может увеличить эффективность.',
    impact: 'Увеличение точности обнаружения завышенных цен',
    actionItems: [
      'Проанализировать причины ложных срабатываний',
      'Обновить источники рыночных данных',
      'Скорректировать пороговые значения правила',
    ],
    affectedKPIs: ['KPI-005', 'KPI-001'],
    createdAt: '2024-11-29T15:30:00Z',
  },
];

export const strategicHandlers = [
  // POST /strategic/dashboard - Получить данные стратегической панели
  http.post(`${API_BASE_URL}/strategic/dashboard`, async ({ request }) => {
    await delay(800);
    const period = await request.json() as AnalyticsPeriod;
    console.log('📊 [MSW] Fetching strategic dashboard for period:', period);
    
    const dashboard = generateStrategicDashboard(period);
    return HttpResponse.json(dashboard);
  }),

  // POST /strategic/insights - Получить стратегические инсайты
  http.post(`${API_BASE_URL}/strategic/insights`, async ({ request }) => {
    await delay(600);
    const period = await request.json() as AnalyticsPeriod;
    console.log('💡 [MSW] Fetching strategic insights for period:', period);
    
    return HttpResponse.json(mockInsights);
  }),

  // POST /strategic/export - Экспортировать стратегический отчет
  http.post(`${API_BASE_URL}/strategic/export`, async ({ request }) => {
    await delay(2500);
    const options = await request.json() as ExportReportOptions;
    console.log(`📥 [MSW] Exporting strategic report as ${options.format}:`, options);
    
    // Создать фиктивный файл
    let content = `Strategic Report\n`;
    content += `Period: ${options.period.label}\n`;
    content += `From: ${options.period.startDate}\n`;
    content += `To: ${options.period.endDate}\n\n`;
    content += `Format: ${options.format}\n`;
    content += `Sections: ${options.sections.join(', ')}\n`;
    content += `Include Charts: ${options.includeCharts ? 'Yes' : 'No'}\n`;
    content += `Include Details: ${options.includeDetails ? 'Yes' : 'No'}\n\n`;
    content += `This is a mock report generated by MSW.\n`;
    
    let mimeType: string;
    switch (options.format) {
      case 'PDF':
        mimeType = 'application/pdf';
        break;
      case 'EXCEL':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'POWERPOINT':
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      default:
        mimeType = 'application/octet-stream';
    }
    
    const blob = new Blob([content], { type: mimeType });
    return HttpResponse.json(blob);
  }),

  // PUT /strategic/kpi/:kpiId/target - Обновить целевое значение KPI
  http.put(`${API_BASE_URL}/strategic/kpi/:kpiId/target`, async ({ request, params }) => {
    await delay(500);
    const { kpiId } = params;
    const { targetValue } = await request.json() as { targetValue: number };
    console.log(`🎯 [MSW] Updating KPI ${kpiId} target to ${targetValue}`);
    
    return HttpResponse.json({ message: 'Target updated successfully' });
  }),
];
