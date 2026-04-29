import { delay, http, HttpResponse } from 'msw';
import type {
  ArchiveCaseItem,
  ArchiveIncidentItem,
  ArchiveNonComplianceItem,
  ArchivePlanItem,
} from '@shared/lib/api/archiveApi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

const archivedIncidents: ArchiveIncidentItem[] = [
  {
    id: 'INC-2024-155',
    title: 'Закупка у поставщика без НДС при обязательном требовании',
    description: 'Нарушение требований тендера по работе с плательщиками НДС.',
    severity: 'MEDIUM',
    status: 'RESOLVED',
    resolvedAt: '2024-11-27T15:00:00Z',
  },
  {
    id: 'INC-2024-154',
    title: 'Превышение допустимого отклонения цены',
    description: 'Закупка дороже среднерыночной на 42%, инцидент закрыт как исключение.',
    severity: 'LOW',
    status: 'FALSE_POSITIVE',
    resolvedAt: '2024-11-22T14:00:00Z',
  },
  {
    id: 'INC-2024-153',
    title: 'Закупка у поставщика из санкционного списка',
    description: 'Инцидент эскалирован в случай для детального расследования.',
    severity: 'CRITICAL',
    status: 'ESCALATED_TO_CASE',
    resolvedAt: '2024-11-20T16:00:00Z',
  },
];

const archivedNonCompliance: ArchiveNonComplianceItem[] = [
  {
    id: 'NC-001',
    title: 'Нарушение требований по НДС',
    source: 'Комплаенс-контроль',
    category: 'COMPLIANCE',
    severity: 'MEDIUM',
    date: '2024-11-27T15:00:00Z',
  },
  {
    id: 'NC-002',
    title: 'Дубликаты контрагентов',
    source: 'Качество данных',
    category: 'DATA_QUALITY',
    severity: 'LOW',
    date: '2024-11-22T14:00:00Z',
  },
  {
    id: 'NC-003',
    title: 'Поставщик из санкционного списка',
    source: 'Правило мониторинга',
    category: 'COMPLIANCE',
    severity: 'CRITICAL',
    date: '2024-11-20T16:00:00Z',
  },
];

const archivedCases: ArchiveCaseItem[] = [
  {
    id: 'CS-2024-005',
    title: 'Ложное срабатывание правила',
    description: 'Случай закрыт после подтверждения допустимого исключения.',
    status: 'CLOSED',
    priority: 'LOW',
    ownerName: 'Иван Иванов',
    updatedAt: '2024-11-16T12:00:00Z',
  },
  {
    id: 'CS-2024-006',
    title: 'Отклоненный кейс проверки контрагента',
    description: 'Случай отклонен по результатам верификации руководителем.',
    status: 'REJECTED',
    priority: 'NORMAL',
    ownerName: 'Мария Сидорова',
    updatedAt: '2024-11-14T18:40:00Z',
  },
];

const archivedPlans: ArchivePlanItem[] = [
  {
    id: 'AP-2024-006',
    title: 'План расследования по налоговому риску',
    description: 'Комплекс действий по устранению найденных несоответствий.',
    caseTitle: 'Налоговый риск поставщика',
    status: 'COMPLETED',
    progressPercentage: 100,
    totalTasks: 5,
    completedTasks: 5,
    createdAt: '2024-11-10T09:00:00Z',
  },
  {
    id: 'AP-2024-007',
    title: 'План по сверке контрагентов',
    description: 'План был отклонен, требуется доработка.',
    caseTitle: 'Аудит справочника контрагентов',
    status: 'REJECTED',
    progressPercentage: 60,
    totalTasks: 5,
    completedTasks: 3,
    createdAt: '2024-11-12T10:30:00Z',
  },
];

export const archiveHandlers = [
  http.get(`${API_BASE_URL}/archive/incidents`, async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    const severity = url.searchParams.get('severity');
    const status = url.searchParams.get('status');

    const filtered = archivedIncidents.filter(item => {
      const byQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      const bySeverity = !severity || severity === 'all' || item.severity === severity;
      const byStatus = !status || status === 'all' || item.status === status;
      return byQuery && bySeverity && byStatus;
    });

    return HttpResponse.json(filtered);
  }),

  http.get(`${API_BASE_URL}/archive/non-compliance`, async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    const source = url.searchParams.get('source');
    const severity = url.searchParams.get('severity');

    const filtered = archivedNonCompliance.filter(item => {
      const byQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      const bySource = !source || source === 'all' || item.source === source;
      const bySeverity = !severity || severity === 'all' || item.severity === severity;
      return byQuery && bySource && bySeverity;
    });

    return HttpResponse.json(filtered);
  }),

  http.get(`${API_BASE_URL}/archive/cases`, async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');

    const filtered = archivedCases.filter(item => {
      const byQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);
      const byStatus = !status || status === 'all' || item.status === status;
      const byPriority = !priority || priority === 'all' || item.priority === priority;
      return byQuery && byStatus && byPriority;
    });

    return HttpResponse.json(filtered);
  }),

  http.get(`${API_BASE_URL}/archive/investigation-plans`, async ({ request }) => {
    await delay(250);
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    const status = url.searchParams.get('status');
    const progress = url.searchParams.get('progress');

    const filtered = archivedPlans.filter(item => {
      const byQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.caseTitle.toLowerCase().includes(q);
      const byStatus = !status || status === 'all' || item.status === status;
      const byProgress =
        !progress ||
        progress === 'all' ||
        (progress === 'full' && item.progressPercentage === 100) ||
        (progress === 'partial' && item.progressPercentage < 100);
      return byQuery && byStatus && byProgress;
    });

    return HttpResponse.json(filtered);
  }),
];
