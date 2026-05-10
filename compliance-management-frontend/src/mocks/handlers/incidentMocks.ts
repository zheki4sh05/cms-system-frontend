// src/mocks/handlers_incidents.ts

import { http, HttpResponse, delay } from 'msw';
import {
  type Incident,
  IncidentStatus,
  type IncidentSeverity,
  type IncidentCategory,
  type IncidentStatistics,
  type ResolveIncidentRequest,
  type CreateCaseFromIncidentsRequest,
  type ManagerWorkload,
  type IncidentDistribution,
  type ReassignIncidentRequest,
  type EscalateIncidentRequest,
  type IncidentAssignment,
  type IncidentViewDto,
  type IncidentsOverviewResponse,
} from '@shared/types/incidentTypes';
import type { Case, CaseStatus } from '@shared/types/caseTypes';
import type { TeamKPI } from '@shared/types/supervisorTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
const API_ROOT = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

// GET /api/incidents/kpi/managers — KPI менеджеров для супервизора
const mockManagersKpiItems: TeamKPI[] = [
  {
    managerId: '3',
    managerName: 'Иван Иванов',
    assignedIncidents: 45,
    resolvedIncidents: 42,
    activeCases: 8,
    completedCases: 7,
    avgResolutionTime: 28,
    onTimeCompletion: 94,
  },
  {
    managerId: '4',
    managerName: 'Петр Петров',
    assignedIncidents: 38,
    resolvedIncidents: 34,
    activeCases: 6,
    completedCases: 5,
    avgResolutionTime: 32,
    onTimeCompletion: 89,
  },
  {
    managerId: '5',
    managerName: 'Мария Сидорова',
    assignedIncidents: 42,
    resolvedIncidents: 37,
    activeCases: 7,
    completedCases: 6,
    avgResolutionTime: 35,
    onTimeCompletion: 86,
  },
  {
    managerId: '6',
    managerName: 'Алексей Смирнов',
    assignedIncidents: 31,
    resolvedIncidents: 26,
    activeCases: 5,
    completedCases: 3,
    avgResolutionTime: 41,
    onTimeCompletion: 78,
  },
];

const mockIncidentsOverview: IncidentsOverviewResponse = {
  scope: 'DEPARTMENT',
  incidents: {
    byStatus: {
      OPEN: 4,
      PARTLY_PROGRESS: 6,
      IN_PROGRESS: 3,
      RESOLVED: 18,
    },
    withDocumentId: 22,
    withoutDocumentId: 9,
    staleUnresolved: 2,
  },
  findings: {
    total: 31,
    withoutAssignedUser: 5,
  },
  cases: {
    total: 14,
    waitingVerification: 4,
    closed: 5,
    other: 5,
  },
  actionPlans: {
    withOverdueTasks: 3,
  },
  riskHotspots: [
    { riskObjectId: 'RO-Z-01', incidentCount: 9, name: 'Закупки комплектующих' },
    { riskObjectId: 'RO-D-42', incidentCount: 7, name: 'Контрагент Alfa' },
    { riskObjectId: 'RO-S-11', incidentCount: 5, name: 'Склад регион Восток' },
    { riskObjectId: 'RO-F-03', incidentCount: 4, name: null },
    { riskObjectId: 'RO-Q-07', incidentCount: 2, name: 'Тендеры Q1' },
  ],
  incidentsByRiskObjectSeverity: {
    low: 10,
    medium: 12,
    high: 8,
    unknown: 1,
  },
};

// Моковые данные инцидентов
let mockIncidents: Incident[] = [
  {
    id: 'INC-2024-156',
    title: 'Менеджер проводит закупки у компании, где является совладельцем',
    description: 'Обнаружено, что менеджер Сидоров А.И. проводит закупки у ООО "Техноком", где он является совладельцем (25% доли) согласно данным ЕГРЮЛ.',
    status: 'NEW' as IncidentStatus,
    severity: 'CRITICAL' as IncidentSeverity,
    category: 'ETHICS' as IncidentCategory,
    ruleId: 'RULE-001',
    ruleName: 'Конфликт интересов при закупках',
    ruleExpression: 'when manager.id in vendor.owners then raise_incident(CRITICAL)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-12-01T11:00:00Z',
    createdAt: '2024-12-01T11:00:00Z',
    updatedAt: '2024-12-01T11:00:00Z',
    sourceSystem: 'ERP',
    sourceEventId: 'EVT-2024-5678',
    vendorId: 'VENDOR-123',
    vendorName: 'ООО "Техноком"',
    amount: 1250000,
    payloadJson: {
      managerId: 'MGR-456',
      managerName: 'Сидоров А.И.',
      vendorId: 'VENDOR-123',
      vendorName: 'ООО "Техноком"',
      ownership: '25%',
      contractAmount: 1250000,
      contractDate: '2024-11-28',
    },
  },
  {
    id: 'INC-2024-157',
    title: 'Превышение лимита закупки без согласования',
    description: 'Закупка на сумму 850 000 руб. была проведена без согласования с финансовым директором. Лимит для самостоятельного утверждения: 500 000 руб.',
    status: 'NEW' as IncidentStatus,
    severity: 'HIGH' as IncidentSeverity,
    category: 'FINANCIAL' as IncidentCategory,
    ruleId: 'RULE-002',
    ruleName: 'Превышение лимита без согласования',
    ruleExpression: 'when purchase.amount > 500000 and not exists(approval.cfo) then raise_incident(HIGH)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-12-02T09:15:00Z',
    createdAt: '2024-12-02T09:15:00Z',
    updatedAt: '2024-12-02T09:15:00Z',
    sourceSystem: '1C',
    sourceEventId: 'EVT-2024-5679',
    vendorId: 'VENDOR-234',
    vendorName: 'ООО "Альфа Поставка"',
    amount: 850000,
    departmentId: 'DEPT-002',
    payloadJson: {
      purchaseId: 'PO-2024-1234',
      amount: 850000,
      limit: 500000,
      approvals: ['Менеджер', 'Руководитель отдела'],
      missingApproval: 'Финансовый директор',
    },
  },
  {
    id: 'INC-2024-158',
    title: 'Закупка у поставщика с истекшей лицензией',
    description: 'ООО "БетаСтрой" проводит поставку строительных материалов, но срок действия их лицензии истек 15.11.2024.',
    status: 'ASSIGNED' as IncidentStatus,
    severity: 'MEDIUM' as IncidentSeverity,
    category: 'COMPLIANCE' as IncidentCategory,
    ruleId: 'RULE-003',
    ruleName: 'Истекшая лицензия поставщика',
    ruleExpression: 'when vendor.license.expiry < current_date then raise_incident(MEDIUM)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-12-01T14:30:00Z',
    createdAt: '2024-12-01T14:30:00Z',
    updatedAt: '2024-12-02T08:00:00Z',
    sourceSystem: 'ERP',
    sourceEventId: 'EVT-2024-5680',
    vendorId: 'VENDOR-345',
    vendorName: 'ООО "БетаСтрой"',
    amount: 320000,
    payloadJson: {
      vendorId: 'VENDOR-345',
      vendorName: 'ООО "БетаСтрой"',
      licenseType: 'Строительная лицензия',
      expiryDate: '2024-11-15',
      currentDate: '2024-12-01',
      contractAmount: 320000,
    },
  },
  {
    id: 'INC-2024-PARTLY-1',
    title: 'Совместная проверка контрагента (частичный прогресс)',
    description:
      'Другой исполнитель уже взял инцидент в работу; текущий пользователь может присоединиться через «Взять в работу».',
    status: 'PARTLY_PROGRESS' as IncidentStatus,
    severity: 'MEDIUM' as IncidentSeverity,
    category: 'VENDOR' as IncidentCategory,
    ruleId: 'RULE-005',
    ruleName: 'Проверка контрагента',
    ruleExpression: 'when vendor.kyc.pending then raise_incident(MEDIUM)',
    assignedTo: '2',
    assignedToName: 'Петр Петров',
    employees: [{ userId: '2' }],
    detectedAt: '2024-12-03T10:00:00Z',
    createdAt: '2024-12-03T10:00:00Z',
    updatedAt: '2024-12-03T10:00:00Z',
    sourceSystem: 'KYC',
    sourceEventId: 'EVT-PARTLY-1',
    vendorId: 'VENDOR-999',
    vendorName: 'ООО "Тест"',
    amount: 0,
    payloadJson: {
      vendorId: 'VENDOR-999',
      note: 'Демо PARTLY_PROGRESS для кнопки assign-to-me',
    },
  },
  {
    id: 'INC-2024-159',
    title: 'Систематическое опоздание поставки (7-й случай за 3 месяца)',
    description: 'Поставщик ООО "Гамма Логистика" в очередной раз нарушил сроки поставки. Это 7-й случай за последние 3 месяца.',
    status: 'IN_REVIEW' as IncidentStatus,
    severity: 'MEDIUM' as IncidentSeverity,
    category: 'LOGISTICS' as IncidentCategory,
    ruleId: 'RULE-004',
    ruleName: 'Систематическое нарушение сроков',
    ruleExpression: 'when count(vendor.delays, 3_months) >= 5 then raise_incident(MEDIUM)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-12-01T16:00:00Z',
    createdAt: '2024-12-01T16:00:00Z',
    updatedAt: '2024-12-02T10:30:00Z',
    sourceSystem: 'WMS',
    sourceEventId: 'EVT-2024-5681',
    vendorId: 'VENDOR-456',
    vendorName: 'ООО "Гамма Логистика"',
    payloadJson: {
      vendorId: 'VENDOR-456',
      delayCount: 7,
      period: '3 месяца',
      avgDelayDays: 4.5,
      lastDeliveries: [
        { date: '2024-11-28', plannedDate: '2024-11-25', delayDays: 3 },
        { date: '2024-11-15', plannedDate: '2024-11-10', delayDays: 5 },
        { date: '2024-10-30', plannedDate: '2024-10-25', delayDays: 5 },
      ],
    },
  },
  {
    id: 'INC-2024-160',
    title: 'Дублирование записи поставщика в базе данных',
    description: 'Обнаружено 3 записи для ООО "Альфа" с разными идентификаторами: VENDOR-234, VENDOR-345, VENDOR-456',
    status: 'ASSIGNED' as IncidentStatus,
    severity: 'LOW' as IncidentSeverity,
    category: 'DATA_QUALITY' as IncidentCategory,
    ruleId: 'RULE-005',
    ruleName: 'Дубликаты контрагентов',
    ruleExpression: 'when count(vendor.inn) > 1 then raise_incident(LOW)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-11-30T10:00:00Z',
    createdAt: '2024-11-30T10:00:00Z',
    updatedAt: '2024-12-01T09:00:00Z',
    sourceSystem: 'CRM',
    sourceEventId: 'EVT-2024-5682',
    vendorName: 'ООО "Альфа"',
    payloadJson: {
      inn: '7707123456',
      duplicates: [
        { id: 'VENDOR-234', name: 'ООО "Альфа"', createdAt: '2024-01-15' },
        { id: 'VENDOR-345', name: 'ООО Альфа', createdAt: '2024-03-20' },
        { id: 'VENDOR-456', name: 'ООО "АЛЬФА"', createdAt: '2024-06-10' },
      ],
    },
  },
  {
    id: 'INC-2024-161',
    title: 'Изменение цен поставщиком после согласования бюджета',
    description: 'Поставщик ООО "Дельта" увеличил цены на 15% после согласования и утверждения бюджета закупки.',
    status: 'NEW' as IncidentStatus,
    severity: 'HIGH' as IncidentSeverity,
    category: 'FINANCIAL' as IncidentCategory,
    ruleId: 'RULE-006',
    ruleName: 'Изменение цен после согласования',
    ruleExpression: 'when vendor.price_change > 10% after budget.approval then raise_incident(HIGH)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-12-02T11:00:00Z',
    createdAt: '2024-12-02T11:00:00Z',
    updatedAt: '2024-12-02T11:00:00Z',
    sourceSystem: 'ERP',
    sourceEventId: 'EVT-2024-5683',
    vendorId: 'VENDOR-567',
    vendorName: 'ООО "Дельта"',
    amount: 450000,
    payloadJson: {
      vendorId: 'VENDOR-567',
      originalPrice: 390000,
      newPrice: 450000,
      priceChange: 15.4,
      budgetApprovalDate: '2024-11-20',
      priceChangeDate: '2024-12-01',
    },
  },
  {
    id: 'INC-2024-155',
    title: 'Закупка у поставщика без НДС при обязательном требовании',
    description: 'Проведена закупка у ООО "Эпсилон", применяющего УСН, в то время как требования тендера предусматривали работу только с плательщиками НДС.',
    status: 'RESOLVED' as IncidentStatus,
    severity: 'MEDIUM' as IncidentSeverity,
    category: 'COMPLIANCE' as IncidentCategory,
    ruleId: 'RULE-007',
    ruleName: 'Нарушение требований по НДС',
    ruleExpression: 'when tender.requires_vat and vendor.vat_status = false then raise_incident(MEDIUM)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-11-25T08:00:00Z',
    createdAt: '2024-11-25T08:00:00Z',
    updatedAt: '2024-11-27T15:00:00Z',
    resolvedAt: '2024-11-27T15:00:00Z',
    sourceSystem: 'ERP',
    sourceEventId: 'EVT-2024-5654',
    vendorId: 'VENDOR-678',
    vendorName: 'ООО "Эпсилон"',
    amount: 180000,
    resolutionNotes: 'Подтверждено руководством, что требование по НДС было изменено. Документы обновлены в системе.',
    payloadJson: {
      tenderId: 'TENDER-2024-089',
      vendorId: 'VENDOR-678',
      vatStatus: false,
      tenderRequirement: 'VAT_REQUIRED',
    },
  },
  {
    id: 'INC-2024-154',
    title: 'Превышение допустимого отклонения цены от среднерыночной',
    description: 'Цена на офисную бумагу превышает среднерыночную на 42%. Допустимое отклонение: 20%.',
    status: 'FALSE_POSITIVE' as IncidentStatus,
    severity: 'LOW' as IncidentSeverity,
    category: 'FINANCIAL' as IncidentCategory,
    ruleId: 'RULE-008',
    ruleName: 'Превышение рыночной цены',
    ruleExpression: 'when (purchase.price - market.avg_price) / market.avg_price > 0.2 then raise_incident(LOW)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-11-20T09:30:00Z',
    createdAt: '2024-11-20T09:30:00Z',
    updatedAt: '2024-11-22T14:00:00Z',
    resolvedAt: '2024-11-22T14:00:00Z',
    sourceSystem: '1C',
    sourceEventId: 'EVT-2024-5644',
    vendorId: 'VENDOR-789',
    vendorName: 'ООО "Оптима"',
    amount: 25000,
    falsePositiveReason: 'Закупка производилась со срочной доставкой в удаленный филиал, что объясняет повышенную стоимость. Это было предварительно согласовано.',
    payloadJson: {
      productName: 'Офисная бумага А4, 80г/м2',
      purchasePrice: 350,
      marketAvgPrice: 246,
      deviation: 42.3,
      reason: 'Срочная доставка в удаленный регион',
    },
  },
  {
    id: 'INC-2024-153',
    title: 'Закупка у поставщика из санкционного списка',
    description: 'Обнаружена попытка проведения закупки у компании, включенной в санкционный список.',
    status: 'ESCALATED_TO_CASE' as IncidentStatus,
    severity: 'CRITICAL' as IncidentSeverity,
    category: 'COMPLIANCE' as IncidentCategory,
    ruleId: 'RULE-009',
    ruleName: 'Санкционный список',
    ruleExpression: 'when vendor.id in sanctions.list then raise_incident(CRITICAL)',
    assignedTo: '1',
    assignedToName: 'Иван Иванов',
    detectedAt: '2024-11-18T10:00:00Z',
    createdAt: '2024-11-18T10:00:00Z',
    updatedAt: '2024-11-20T16:00:00Z',
    resolvedAt: '2024-11-20T16:00:00Z',
    caseId: 'CS-2024-003',
    caseTitle: 'Подозрение на конфликт интересов',
    sourceSystem: 'ERP',
    sourceEventId: 'EVT-2024-5634',
    vendorId: 'VENDOR-890',
    vendorName: 'ООО "Зета"',
    amount: 950000,
    payloadJson: {
      vendorId: 'VENDOR-890',
      vendorName: 'ООО "Зета"',
      sanctionList: 'EU Sanctions List',
      addedDate: '2024-09-15',
      reason: 'Political sanctions',
    },
  },
];

// Моковая нагрузка менеджеров
const mockManagersWorkload: ManagerWorkload[] = [
  {
    managerId: '3',
    managerName: 'Иван Иванов',
    avatar: undefined,
    assignedIncidents: 45,
    activeIncidents: 12,
    newIncidents: 3,
    avgResolutionTime: 28,
    completionRate: 94,
    overdueIncidents: 0,
    status: 'BUSY',
    capacity: 75,
  },
  {
    managerId: '4',
    managerName: 'Петр Петров',
    avatar: undefined,
    assignedIncidents: 38,
    activeIncidents: 8,
    newIncidents: 2,
    avgResolutionTime: 32,
    completionRate: 89,
    overdueIncidents: 1,
    status: 'AVAILABLE',
    capacity: 60,
  },
  {
    managerId: '5',
    managerName: 'Мария Сидорова',
    avatar: undefined,
    assignedIncidents: 52,
    activeIncidents: 18,
    newIncidents: 5,
    avgResolutionTime: 35,
    completionRate: 86,
    overdueIncidents: 3,
    status: 'OVERLOADED',
    capacity: 95,
  },
  {
    managerId: '6',
    managerName: 'Алексей Смирнов',
    avatar: undefined,
    assignedIncidents: 31,
    activeIncidents: 7,
    newIncidents: 1,
    avgResolutionTime: 41,
    completionRate: 78,
    overdueIncidents: 2,
    status: 'AVAILABLE',
    capacity: 55,
  },
];

// Моковое распределение инцидентов
const mockIncidentDistribution: IncidentDistribution[] = [
  {
    managerId: '5',
    managerName: 'Мария Сидорова',
    count: 52,
    percentage: 31,
  },
  {
    managerId: '3',
    managerName: 'Иван Иванов',
    count: 45,
    percentage: 27,
  },
  {
    managerId: '4',
    managerName: 'Петр Петров',
    count: 38,
    percentage: 23,
  },
  {
    managerId: '6',
    managerName: 'Алексей Смирнов',
    count: 31,
    percentage: 19,
  },
];

// Моковая история переназначений
const mockAssignmentHistory: Record<string, IncidentAssignment[]> = {
  'INC-2024-003': [
    {
      incidentId: 'INC-2024-003',
      fromManagerId: '6',
      toManagerId: '3',
      reason: 'Менеджер Алексей Смирнов перегружен. Переназначение для ускорения решения.',
      reassignedBy: 'Петр Петров (Руководитель)',
      reassignedAt: '2024-11-28T14:30:00Z',
    },
  ],
  'INC-2024-008': [
    {
      incidentId: 'INC-2024-008',
      fromManagerId: '5',
      toManagerId: '4',
      reason: 'Конфликт интересов: менеджер работал с данным поставщиком ранее.',
      reassignedBy: 'Петр Петров (Руководитель)',
      reassignedAt: '2024-11-25T10:15:00Z',
    },
    {
      incidentId: 'INC-2024-008',
      fromManagerId: '4',
      toManagerId: '3',
      reason: 'Менеджер Петров в отпуске. Переназначение на время отсутствия.',
      reassignedBy: 'Петр Петров (Руководитель)',
      reassignedAt: '2024-11-29T09:00:00Z',
    },
  ],
};


// Моковые случаи (для эскалации)
export let mockCases: Case[] = [];

const MOCK_CURRENT_USER_ID = '1';

async function handleGetMyIncidents({ request }: { request: Request }) {
  await delay(400);
  console.log('🚨 [MSW] Fetching my incidents');

  const url = new URL(request.url);
  const status = url.searchParams.get('status')?.split(',');
  const severity = url.searchParams.get('severity')?.split(',');
  const category = url.searchParams.get('category')?.split(',');
  const dateFrom = url.searchParams.get('dateFrom');
  const dateTo = url.searchParams.get('dateTo');
  const searchQuery = url.searchParams.get('q');

  let filtered = [...mockIncidents];

  if (status && status.length > 0) {
    filtered = filtered.filter(i => status.includes(i.status));
  }

  if (severity && severity.length > 0) {
    filtered = filtered.filter(i => severity.includes(i.severity));
  }

  if (category && category.length > 0) {
    filtered = filtered.filter(i => category.includes(i.category));
  }

  if (dateFrom) {
    filtered = filtered.filter(i => new Date(i.detectedAt) >= new Date(dateFrom));
  }
  if (dateTo) {
    filtered = filtered.filter(i => new Date(i.detectedAt) <= new Date(dateTo));
  }

  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(i =>
      i.title.toLowerCase().includes(query) ||
      i.description.toLowerCase().includes(query) ||
      i.id.toLowerCase().includes(query) ||
      i.ruleName.toLowerCase().includes(query)
    );
  }

  return HttpResponse.json(filtered);
}

async function handleAssignIncidentToMe({ params }: { params: { incidentId: string } }) {
  await delay(300);
  const incidentId = String(params.incidentId);
  console.log(`👤 [MSW] Assigning incident ${incidentId} to me`);

  const index = mockIncidents.findIndex(i => i.id === incidentId);

  if (index === -1) {
    return HttpResponse.json(
      { message: 'Инцидент не найден', code: 'INCIDENT_NOT_FOUND' },
      { status: 404 }
    );
  }

  const cur = mockIncidents[index];
  const employees = [...(cur.employees ?? [])];
  if (!employees.some((e) => e.userId === MOCK_CURRENT_USER_ID)) {
    employees.push({ userId: MOCK_CURRENT_USER_ID });
  }

  const nextStatus: IncidentStatus =
    cur.status === 'PARTLY_PROGRESS' ? 'PARTLY_PROGRESS' : 'ASSIGNED';

  mockIncidents[index] = {
    ...cur,
    status: nextStatus,
    employees,
    assignedTo: MOCK_CURRENT_USER_ID,
    assignedToName: 'Иван Иванов',
    updatedAt: new Date().toISOString(),
  };

  const updated = mockIncidents[index];
  return HttpResponse.json({
    ...updated,
    incidentId: updated.id,
    findingId: 'mock-finding',
    status: updated.status,
  });
}

export const incidentsHandlers = [

  // GET /incidents/managers-workload - Получить нагрузку менеджеров
  http.get(`${API_BASE_URL}/incidents/managers-workload`, async () => {
    await delay(500);
    console.log('👥 [MSW] Fetching managers workload');
    return HttpResponse.json(mockManagersWorkload);
  }),

  // GET /incidents/distribution - Получить распределение инцидентов
  http.get(`${API_BASE_URL}/incidents/distribution`, async () => {
    await delay(400);
    console.log('📊 [MSW] Fetching incident distribution');
    return HttpResponse.json(mockIncidentDistribution);
  }),

  // POST /incidents/:incidentId/reassign - Переназначить инцидент
  http.post(`${API_BASE_URL}/incidents/:incidentId/reassign`, async ({ request, params }) => {
    await delay(600);
    const { incidentId } = params;
    const body = await request.json() as ReassignIncidentRequest;
    console.log(`🔄 [MSW] Reassigning incident ${incidentId}:`, body);
    
    const index = mockIncidents.findIndex(i => i.id === incidentId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Инцидент не найден', code: 'INCIDENT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Найти нового менеджера
    const newManager = mockManagersWorkload.find(m => m.managerId === body.toManagerId);
    
    if (!newManager) {
      return HttpResponse.json(
        { message: 'Менеджер не найден', code: 'MANAGER_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Сохранить старого ответственного
    const oldManagerId = mockIncidents[index].assignedTo;
    const oldManagerName = mockIncidents[index].assignedToName;
    
    // Обновить инцидент
    mockIncidents[index] = {
      ...mockIncidents[index],
      assignedTo: body.toManagerId,
      assignedToName: newManager.managerName,
      updatedAt: new Date().toISOString(),
    };
    
    // Добавить в историю переназначений
    if (!mockAssignmentHistory[incidentId as string]) {
      mockAssignmentHistory[incidentId as string] = [];
    }
    
    mockAssignmentHistory[incidentId as string].push({
      incidentId: incidentId as string,
      fromManagerId: oldManagerId,
      toManagerId: body.toManagerId,
      reason: body.reason,
      reassignedBy: 'Петр Петров (Руководитель)',
      reassignedAt: new Date().toISOString(),
    });
    
    // Обновить нагрузку менеджеров
    const oldManagerIndex = mockManagersWorkload.findIndex(m => m.managerId === oldManagerId);
    const newManagerIndex = mockManagersWorkload.findIndex(m => m.managerId === body.toManagerId);
    
    if (oldManagerIndex !== -1) {
      mockManagersWorkload[oldManagerIndex].assignedIncidents--;
      mockManagersWorkload[oldManagerIndex].activeIncidents--;
      mockManagersWorkload[oldManagerIndex].capacity = Math.max(0, mockManagersWorkload[oldManagerIndex].capacity - 5);
      
      // Обновить статус
      if (mockManagersWorkload[oldManagerIndex].capacity < 70) {
        mockManagersWorkload[oldManagerIndex].status = 'AVAILABLE';
      } else if (mockManagersWorkload[oldManagerIndex].capacity < 90) {
        mockManagersWorkload[oldManagerIndex].status = 'BUSY';
      }
    }
    
    if (newManagerIndex !== -1) {
      mockManagersWorkload[newManagerIndex].assignedIncidents++;
      mockManagersWorkload[newManagerIndex].activeIncidents++;
      mockManagersWorkload[newManagerIndex].capacity = Math.min(100, mockManagersWorkload[newManagerIndex].capacity + 5);
      
      // Обновить статус
      if (mockManagersWorkload[newManagerIndex].capacity >= 90) {
        mockManagersWorkload[newManagerIndex].status = 'OVERLOADED';
      } else if (mockManagersWorkload[newManagerIndex].capacity >= 70) {
        mockManagersWorkload[newManagerIndex].status = 'BUSY';
      }
    }
    
    // Обновить распределение
    const oldDistIndex = mockIncidentDistribution.findIndex(d => d.managerId === oldManagerId);
    const newDistIndex = mockIncidentDistribution.findIndex(d => d.managerId === body.toManagerId);
    
    if (oldDistIndex !== -1) {
      mockIncidentDistribution[oldDistIndex].count--;
    }
    
    if (newDistIndex !== -1) {
      mockIncidentDistribution[newDistIndex].count++;
    }
    
    // Пересчитать проценты
    const total = mockIncidentDistribution.reduce((sum, d) => sum + d.count, 0);
    mockIncidentDistribution.forEach(d => {
      d.percentage = Math.round((d.count / total) * 100);
    });
    
    return HttpResponse.json(mockIncidents[index]);
  }),

  // POST /incidents/:incidentId/escalate - Эскалировать инцидент
  http.post(`${API_BASE_URL}/incidents/:incidentId/escalate`, async ({ request, params }) => {
    await delay(700);
    const { incidentId } = params;
    const body = await request.json() as EscalateIncidentRequest;
    console.log(`⬆️ [MSW] Escalating incident ${incidentId}:`, body);
    
    const index = mockIncidents.findIndex(i => i.id === incidentId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Инцидент не найден', code: 'INCIDENT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Обновить инцидент - пометить как эскалированный
    mockIncidents[index] = {
      ...mockIncidents[index],
      status:  IncidentStatus.ESCALATED_TO_CASE,
      updatedAt: new Date().toISOString(),
    };
    
    // В реальном приложении здесь будет создан case или отправлено уведомление топ-менеджменту
    console.log(`✅ [MSW] Incident ${incidentId} escalated to top management with urgency: ${body.urgency}`);
    
    return HttpResponse.json(mockIncidents[index]);
  }),

  // GET /incidents/:incidentId/assignment-history - Получить историю переназначений
  http.get(`${API_BASE_URL}/incidents/:incidentId/assignment-history`, async ({ params }) => {
    await delay(400);
    const { incidentId } = params;
    console.log(`📜 [MSW] Fetching assignment history for incident: ${incidentId}`);
    
    const history = mockAssignmentHistory[incidentId as string] || [];
    return HttpResponse.json(history);
  }),

  // GET /incidents/my и GET /api/incidents/my — мои инциденты
  http.get(`${API_BASE_URL}/incidents/my`, handleGetMyIncidents),
  http.get(`${API_ROOT}/api/incidents/my`, handleGetMyIncidents),

  // GET /incidents/statistics и /api/incidents/my/stats - Статистика по инцидентам
  http.get(`${API_BASE_URL}/incidents/statistics`, async () => {
    await delay(300);
    console.log('📊 [MSW] Fetching incident statistics');
    
    const statistics: IncidentStatistics = {
      new: mockIncidents.filter(i => i.status === 'NEW').length,
      assigned: mockIncidents.filter(
        i => i.status === 'ASSIGNED' || i.status === 'PARTLY_PROGRESS'
      ).length,
      inReview: mockIncidents.filter(i => i.status === 'IN_REVIEW').length,
      resolved: mockIncidents.filter(i => i.status === 'RESOLVED').length,
      bySeverity: {
        low: mockIncidents.filter(i => i.severity === 'LOW').length,
        medium: mockIncidents.filter(i => i.severity === 'MEDIUM').length,
        high: mockIncidents.filter(i => i.severity === 'HIGH').length,
        critical: mockIncidents.filter(i => i.severity === 'CRITICAL').length,
      },
      byCategory: [],
      avgResolutionTime: 36, // В часах
    };
    
    return HttpResponse.json(statistics);
  }),

  http.get(`${API_ROOT}/api/incidents/my/stats`, async () => {
    await delay(300);
    console.log('📊 [MSW] Fetching my incident stats');

    const categoryMap = new Map<string, { categoryId: string | null; categoryName: string; incidentCount: number }>();

    mockIncidents.forEach((incident) => {
      const rawCategoryId =
        typeof incident.categoryId === 'string' && incident.categoryId.length > 0
          ? incident.categoryId
          : null;
      const categoryName =
        typeof incident.categoryName === 'string' && incident.categoryName.length > 0
          ? incident.categoryName
          : 'Без категории';
      const key = rawCategoryId || `NO_CATEGORY:${categoryName}`;
      const current = categoryMap.get(key);
      if (current) {
        current.incidentCount += 1;
      } else {
        categoryMap.set(key, {
          categoryId: rawCategoryId,
          categoryName,
          incidentCount: 1,
        });
      }
    });

    const stats = {
      totalIncidents: mockIncidents.length,
      totalFindings: mockIncidents.length,
      totalCases: mockCases.length,
      new: mockIncidents.filter((i) => i.status === 'NEW').length,
      assigned: mockIncidents.filter((i) => i.status === 'ASSIGNED' || i.status === 'PARTLY_PROGRESS').length,
      inReview: mockIncidents.filter((i) => i.status === 'IN_REVIEW').length,
      resolved: mockIncidents.filter((i) => i.status === 'RESOLVED').length,
      bySeverity: {
        low: mockIncidents.filter((i) => i.severity === 'LOW').length,
        medium: mockIncidents.filter((i) => i.severity === 'MEDIUM').length,
        high: mockIncidents.filter((i) => i.severity === 'HIGH').length,
      },
      byCategory: Array.from(categoryMap.values()),
      avgResolutionTime: 36,
    };

    return HttpResponse.json(stats);
  }),

  // GET /api/incidents/kpi/managers — KPI команды (супервизор)
  http.get(`${API_ROOT}/api/incidents/kpi/managers`, async () => {
    await delay(500);
    console.log('👥 [MSW] Fetching managers KPI');
    return HttpResponse.json({ items: mockManagersKpiItems });
  }),

  // GET /api/incidents/overview
  http.get(`${API_ROOT}/api/incidents/overview`, async () => {
    await delay(400);
    console.log('📊 [MSW] Fetching incidents overview');
    return HttpResponse.json(mockIncidentsOverview);
  }),

  // GET /api/incidents/:incidentId/view — детальный просмотр (IncidentApi.getIncidentView)
  http.get(`${API_ROOT}/api/incidents/:incidentId/view`, async ({ params }) => {
    await delay(300);
    const { incidentId } = params;
    const id = String(incidentId);
    console.log(`📄 [MSW] Fetching incident view: ${id}`);

    const incident = mockIncidents.find((i) => i.id === id);
    if (!incident) {
      return HttpResponse.json(
        { message: 'Инцидент не найден', code: 'INCIDENT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const view: IncidentViewDto = {
      findings: [
        {
          id: `finding-${id}`,
          priority: String(incident.severity),
          assignedUserId: incident.assignedTo,
          rulesId: incident.ruleId,
          detectedAt: incident.detectedAt,
          details: {
            title: incident.title,
            severity: incident.severity,
            description: incident.description,
            recommendation:
              'Проверьте материалы инцидента, зафиксируйте решение и при необходимости создайте случай.',
          },
          incidentId: id,
        },
      ],
      documentId: incident.sourceEventId,
      integrationId: 0,
      integrationName: incident.sourceSystem,
    };

    return HttpResponse.json(view);
  }),

  // GET /incidents/:incidentId - Получить инцидент по ID
  http.get(`${API_BASE_URL}/incidents/:incidentId`, async ({ params }) => {
    await delay(300);
    const { incidentId } = params;
    console.log(`📄 [MSW] Fetching incident: ${incidentId}`);
    
    const incident = mockIncidents.find(i => i.id === incidentId);
    
    if (!incident) {
      return HttpResponse.json(
        { message: 'Инцидент не найден', code: 'INCIDENT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(incident);
  }),

  // POST /incidents/:incidentId/resolve - Решить инцидент
  http.post(`${API_BASE_URL}/incidents/:incidentId/resolve`, async ({ request, params }) => {
    await delay(400);
    const { incidentId } = params;
    const body = await request.json() as ResolveIncidentRequest;
    console.log(`✅ [MSW] Resolving incident ${incidentId}:`, body);
    
    const index = mockIncidents.findIndex(i => i.id === incidentId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Инцидент не найден', code: 'INCIDENT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockIncidents[index] = {
      ...mockIncidents[index],
      status: body.status,
      resolutionNotes: body.resolutionNotes,
      falsePositiveReason: body.falsePositiveReason,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockIncidents[index]);
  }),

  // POST /incidents/create-case - Создать случай из инцидентов
  http.post(`${API_BASE_URL}/incidents/create-case`, async ({ request }) => {
    await delay(600);
    const body = await request.json() as CreateCaseFromIncidentsRequest;
    console.log('📁 [MSW] Creating case from incidents:', body);
    
    // Проверить, что все инциденты существуют
    const incidents = mockIncidents.filter(i => body.incidentIds.includes(i.id));
    
    if (incidents.length !== body.incidentIds.length) {
      return HttpResponse.json(
        { message: 'Некоторые инциденты не найдены', code: 'INCIDENTS_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Создать новый случай
    const newCase: Case = {
      id: `CS-2024-${String(mockCases.length + 6).padStart(3, '0')}`,
      title: body.title,
      description: body.description,
      status: 'OPEN' as CaseStatus,
      severity: body.severity as any,
      priority: body.priority as any,
      ownerId: '1',
      ownerName: 'Иван Иванов',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      incidentIds: body.incidentIds,
      tags: [],
      requiresCorrectiveAction: false,
    };
    
    mockCases.push(newCase);
    
    // Обновить статус инцидентов
    body.incidentIds.forEach(incidentId => {
      const index = mockIncidents.findIndex(i => i.id === incidentId);
      if (index !== -1) {
        mockIncidents[index] = {
          ...mockIncidents[index],
          status: 'ESCALATED_TO_CASE' as IncidentStatus,
          caseId: newCase.id,
          caseTitle: newCase.title,
          updatedAt: new Date().toISOString(),
        };
      }
    });
    
    return HttpResponse.json(newCase, { status: 201 });
  }),

  // POST …/assign-to-me — v1 и /api (как в IncidentApi.assignToMe)
  http.post(`${API_BASE_URL}/incidents/:incidentId/assign-to-me`, handleAssignIncidentToMe),
  http.post(`${API_ROOT}/api/incidents/:incidentId/assign-to-me`, handleAssignIncidentToMe),

  // GET /incidents/:incidentId/similar - Получить похожие инциденты
  http.get(`${API_BASE_URL}/incidents/:incidentId/similar`, async ({ params }) => {
    await delay(500);
    const { incidentId } = params;
    console.log(`🔍 [MSW] Fetching similar incidents for: ${incidentId}`);
    
    const incident = mockIncidents.find(i => i.id === incidentId);
    
    if (!incident) {
      return HttpResponse.json(
        { message: 'Инцидент не найден', code: 'INCIDENT_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Найти похожие инциденты (по категории, правилу или поставщику)
    const similar = mockIncidents.filter(i =>
      i.id !== incidentId &&
      (
        i.category === incident.category ||
        i.ruleId === incident.ruleId ||
        (i.vendorId && i.vendorId === incident.vendorId)
      ) &&
      i.status !== 'RESOLVED' &&
      i.status !== 'FALSE_POSITIVE' &&
      i.status !== 'ESCALATED_TO_CASE'
    ).slice(0, 5);
    
    return HttpResponse.json(similar);
  }),
];
