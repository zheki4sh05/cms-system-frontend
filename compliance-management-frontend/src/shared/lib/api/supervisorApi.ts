// src/shared/lib/api/supervisorApi.ts

import { apiClient } from './apiClient';
import { IncidentApi } from './incidentApi';
import type {
  IncidentProblemAreasResponse,
  IncidentRiskHotspotItem,
  IncidentWorkflowStatusOverview,
  IncidentsOverviewResponse,
  IncidentsOverviewSeverityDistribution,
} from '@shared/types/incidentTypes';
import type {
  SupervisorDashboardStats,
  TeamKPI,
  PendingVerificationItem,
  VerificationResponsible,
  RuleEffectiveness,
  FinancialImpact,
  TrendData,
  CategoryDistribution,
  ApproveVerificationRequest,
} from '@shared/types/supervisorTypes';

const boolStrict = (v: unknown): boolean => v === true;

const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

const parseTeamKpiItem = (raw: unknown): TeamKPI => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    managerId: typeof r.managerId === 'string' ? r.managerId : String(r.managerId ?? ''),
    managerName: typeof r.managerName === 'string' ? r.managerName : '',
    assignedIncidents: num(r.assignedIncidents),
    resolvedIncidents: num(r.resolvedIncidents),
    activeCases: num(r.activeCases),
    completedCases: num(r.completedCases),
    avgResolutionTime: num(r.avgResolutionTime),
    onTimeCompletion: num(r.onTimeCompletion),
  };
};

const strOrNull = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return null;
};

/** Backend обычно отдаёт строку; при объекте пробуем типичные ключи из details finding */
const parseDocumentTitle = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const key of ['documentTitle', 'title', 'documentName', 'fileName', 'name']) {
      const s = strOrNull(o[key]);
      if (s) return s;
    }
    return null;
  }
  return strOrNull(v);
};

const parseResponsible = (raw: unknown): VerificationResponsible => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    userId: strOrNull(r.userId),
    employeeId: strOrNull(r.employeeId),
    firstName: strOrNull(r.firstName),
    lastName: strOrNull(r.lastName),
  };
};

const parseIncidentReceivedAt = (v: unknown): string | null => {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && v.trim()) return v.trim();
  return null;
};

const parseRuleEffectivenessItem = (raw: unknown): RuleEffectiveness => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    ruleId: typeof r.ruleId === 'string' ? r.ruleId : String(r.ruleId ?? ''),
    ruleName: typeof r.ruleName === 'string' ? r.ruleName : '',
    categoryId: typeof r.categoryId === 'string' ? r.categoryId : String(r.categoryId ?? ''),
    categoryName: typeof r.categoryName === 'string' ? r.categoryName : '',
    rejectedCount: num(r.rejectedCount),
    closedCount: num(r.closedCount),
    ruleActive: boolStrict(r.ruleActive),
  };
};

const parsePendingVerificationItem = (raw: unknown): PendingVerificationItem => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    actionPlanId: typeof r.actionPlanId === 'string' ? r.actionPlanId : String(r.actionPlanId ?? ''),
    incidentId: typeof r.incidentId === 'string' ? r.incidentId : String(r.incidentId ?? ''),
    documentTitle: parseDocumentTitle(r.documentTitle),
    responsible: parseResponsible(r.responsible),
    incidentReceivedAt: parseIncidentReceivedAt(r.incidentReceivedAt),
  };
};

const pickRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

const pickNumericFromAliases = (
  primary: Record<string, unknown>,
  secondary: Record<string, unknown>,
  aliases: readonly string[]
): number => {
  for (const a of aliases) {
    const candidates = [
      primary[a],
      secondary[a],
      primary[a.toUpperCase()],
      secondary[a.toUpperCase()],
    ];
    for (const c of candidates) {
      if (typeof c === 'number' && Number.isFinite(c)) return Math.max(0, Math.floor(c));
    }
  }
  for (const table of [primary, secondary]) {
    const keys = Object.keys(table);
    for (const ak of keys) {
      const normAk = ak.toLowerCase().replace(/_/g, '');
      const match = aliases.find((a) => a.toLowerCase().replace(/_/g, '') === normAk);
      if (!match) continue;
      const v = table[ak];
      if (typeof v === 'number' && Number.isFinite(v)) return Math.max(0, Math.floor(v));
    }
  }
  return 0;
};

const parseIncidentStatusOverviewBlock = (
  incidentsBlock: Record<string, unknown>
): Partial<Record<IncidentWorkflowStatusOverview, number>> => {
  const nested = pickRecord(
    incidentsBlock.byStatus ?? incidentsBlock.by_status ?? incidentsBlock.status
  );
  const src = Object.keys(nested).length > 0 ? nested : incidentsBlock;

  const statusAliases: Record<IncidentWorkflowStatusOverview, readonly string[]> = {
    OPEN: ['OPEN', 'open'],
    PARTLY_PROGRESS: ['PARTLY_PROGRESS', 'partlyProgress', 'partly_progress'],
    IN_PROGRESS: ['IN_PROGRESS', 'inProgress', 'in_progress'],
    RESOLVED: ['RESOLVED', 'resolved'],
  };

  const out: Partial<Record<IncidentWorkflowStatusOverview, number>> = {};
  (Object.keys(statusAliases) as IncidentWorkflowStatusOverview[]).forEach((key) => {
    out[key] = pickNumericFromAliases(incidentsBlock, src, statusAliases[key]);
  });
  return out;
};

const parseRiskHotspotsOverview = (raw: unknown): IncidentRiskHotspotItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      const row = pickRecord(item);
      const rid = row.riskObjectId ?? row.risk_object_id ?? row.id;
      return {
        riskObjectId: typeof rid === 'string' ? rid : String(rid ?? ''),
        incidentCount: num(row.incidentCount ?? row.incident_count),
        name: strOrNull(row.name ?? row.displayName ?? row.title ?? row.riskObjectName),
      };
    })
    .slice(0, 5);
};

const parseSeverityDistributionOverview = (raw: unknown): IncidentsOverviewSeverityDistribution => {
  const r = pickRecord(raw);
  return {
    low: num(r.low ?? r.LOW),
    medium: num(r.medium ?? r.MEDIUM),
    high: num(r.high ?? r.HIGH),
    unknown: num(r.unknown ?? r.UNKNOWN),
  };
};

const parseIncidentsOverviewPayload = (raw: unknown): IncidentsOverviewResponse => {
  const p = pickRecord(raw);

  let scope: IncidentsOverviewResponse['scope'] = 'DEPARTMENT';
  if (typeof p.scope === 'string') {
    const u = p.scope.trim().toUpperCase();
    if (u === 'COMPANY' || u === 'EXECUTIVE') scope = 'COMPANY';
    else if (u === 'DEPARTMENT') scope = 'DEPARTMENT';
  }

  const inc = pickRecord(p.incidents);
  const incidentsByStatus = parseIncidentStatusOverviewBlock(inc);
  const findings = pickRecord(p.findings);
  const casesBlk = pickRecord(p.cases);
  const plans = pickRecord(p.actionPlans ?? p.action_plans ?? {});

  const totalCases = num(casesBlk.total);
  const closed = num(casesBlk.closed ?? casesBlk.CLOSED);
  const waitingVerification = num(
    casesBlk.waitingVerification ??
      casesBlk.waiting_verification ??
      casesBlk.waitingForVerification
  );
  const explicitOther = num(casesBlk.other ?? casesBlk.OTHER);
  const other =
    explicitOther > 0
      ? explicitOther
      : Math.max(0, totalCases - closed - waitingVerification);

  return {
    scope,
    incidents: {
      byStatus: incidentsByStatus,
      withDocumentId: num(inc.withDocumentId ?? inc.with_document_id),
      withoutDocumentId: num(inc.withoutDocumentId ?? inc.without_document_id),
      staleUnresolved: num(inc.staleUnresolved ?? inc.stale_unresolved),
    },
    findings: {
      total: num(findings.total),
      withoutAssignedUser: num(
        findings.withoutAssignedUser ??
          findings.without_assigned_user ??
          findings.unassigned ??
          findings.withoutAssignee ??
          findings.findingsWithoutAssignee
      ),
    },
    cases: {
      total: totalCases,
      waitingVerification,
      closed,
      other,
    },
    actionPlans: {
      withOverdueTasks: num(plans.withOverdueTasks ?? plans.with_overdue_tasks),
    },
    riskHotspots: parseRiskHotspotsOverview(p.riskHotspots ?? p.risk_hotspots),
    incidentsByRiskObjectSeverity: parseSeverityDistributionOverview(
      p.incidentsByRiskObjectSeverity ?? p.incidents_by_risk_object_severity ?? {}
    ),
  };
};

export class SupervisorApi {
  /**
   * Получить основные метрики для панели руководителя
   */
  static async getDashboardStats(): Promise<SupervisorDashboardStats> {
    const response = await apiClient.get<unknown>('/api/incidents/my/stats');
    const payload = (response.data ?? {}) as Record<string, unknown>;

    return {
      totalIncidents: typeof payload.totalIncidents === 'number' ? payload.totalIncidents : 0,
      totalCases: typeof payload.totalCases === 'number' ? payload.totalCases : 0,
      totalActionPlans: typeof payload.totalFindings === 'number' ? payload.totalFindings : 0,
      incidentsTrend: 0,
      casesTrend: 0,
      resolutionTimeTrend: 0,
      criticalIncidents: typeof payload.criticalIncidents === 'number' ? payload.criticalIncidents : 0,
      overdueActionPlans: typeof payload.overdueActionPlans === 'number' ? payload.overdueActionPlans : 0,
      pendingVerifications:
        typeof payload.pendingVerifications === 'number' ? payload.pendingVerifications : 0,
      avgResolutionTime: typeof payload.avgResolutionTime === 'number' ? payload.avgResolutionTime : 0,
      falsePositiveRate: 0,
      escalationRate: 0,
    };
  }

  /** Сводка по инцидентам для супервизора / топ-менеджмента: GET /api/incidents/overview */
  static async getIncidentsOverview(): Promise<IncidentsOverviewResponse> {
    const response = await apiClient.get<unknown>('/api/incidents/overview');
    return parseIncidentsOverviewPayload(response.data);
  }

  /**
   * KPI менеджеров команды (супервизор): GET /api/incidents/kpi/managers
   */
  static async getTeamKPI(): Promise<TeamKPI[]> {
    const response = await apiClient.get<unknown>('/api/incidents/kpi/managers');
    const payload = (response.data ?? {}) as Record<string, unknown>;
    const items = payload.items;
    if (!Array.isArray(items)) return [];
    return items.map(parseTeamKpiItem);
  }

  /**
   * Очередь верификации планов (WAITING_VERIFICATION): GET /api/supervisor/verification/pending
   */
  static async getVerificationQueue(): Promise<PendingVerificationItem[]> {
    const response = await apiClient.get<unknown>('/api/supervisor/verification/pending');
    const payload = (response.data ?? {}) as Record<string, unknown>;
    const items = payload.items;
    if (!Array.isArray(items)) return [];
    return items.map(parsePendingVerificationItem);
  }

  /**
   * Утвердить или отклонить верификацию: PUT /api/supervisor/verification/:actionPlanId
   */
  static async processVerification(
    actionPlanId: string,
    data: ApproveVerificationRequest
  ): Promise<void> {
    await apiClient.put(`/api/supervisor/verification/${encodeURIComponent(actionPlanId)}`, data);
  }

  /**
   * Проблемные зоны по documentId за месяц (UTC): GET /api/incidents/problem-areas?month=
   */
  static async getProblemAreas(month?: string): Promise<IncidentProblemAreasResponse> {
    const m = typeof month === 'string' ? month.trim() : '';
    const params: Record<string, string> =
      /^\d{4}-\d{2}$/.test(m) ? { month: m } : {};
    const response = await apiClient.get<unknown>('/api/incidents/problem-areas', {
      params,
    });
    const payload = (response.data ?? {}) as Record<string, unknown>;
    const monthOut =
      typeof payload.month === 'string' && /^\d{4}-\d{2}$/.test(payload.month)
        ? payload.month
        : m || '';
    const groupsRaw = Array.isArray(payload.groups) ? payload.groups : [];
    const groups = groupsRaw.map((g) => {
      const row = (g && typeof g === 'object' ? g : {}) as Record<string, unknown>;
      const documentId =
        typeof row.documentId === 'string' ? row.documentId : String(row.documentId ?? '');
      const incidentCount =
        typeof row.incidentCount === 'number' && Number.isFinite(row.incidentCount)
          ? Math.max(0, Math.floor(row.incidentCount))
          : 0;
      const incidentsRaw = Array.isArray(row.incidents) ? row.incidents : [];
      const incidents = incidentsRaw.map((item) => IncidentApi.parseIncidentReportItem(item));
      return { documentId, incidentCount, incidents };
    });
    return { month: monthOut, groups };
  }

  /**
   * Эффективность правил: кейсы REJECTED / CLOSED по ruleId (область по роли).
   * GET /api/incidents/rule-effectiveness
   */
  static async getRuleEffectiveness(): Promise<RuleEffectiveness[]> {
    const response = await apiClient.get<unknown>('/api/incidents/rule-effectiveness');
    const payload = (response.data ?? {}) as Record<string, unknown>;
    const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
    return itemsRaw.map(parseRuleEffectivenessItem);
  }

  /**
   * Получить финансовое влияние
   */
  static async getFinancialImpact(): Promise<FinancialImpact> {
    const response = await apiClient.get<FinancialImpact>('/supervisor/analytics/financial-impact');
    return response.data;
  }

  /**
   * Получить данные трендов
   */
  static async getTrendData(period: 'week' | 'month' | 'quarter'): Promise<TrendData[]> {
    const response = await apiClient.get<TrendData[]>(`/supervisor/analytics/trends?period=${period}`);
    return response.data;
  }

  /**
   * Получить распределение по категориям
   */
  static async getCategoryDistribution(): Promise<CategoryDistribution[]> {
    const response = await apiClient.get<CategoryDistribution[]>('/supervisor/analytics/categories');
    return response.data;
  }

  /**
   * Экспортировать отчет
   */
  static async exportReport(format: 'pdf' | 'excel', period: string): Promise<Blob> {
    const response = await apiClient.get(`/supervisor/reports/export?format=${format}&period=${period}`, {
      responseType: 'blob',
    });
    return response.data;
  }
}
