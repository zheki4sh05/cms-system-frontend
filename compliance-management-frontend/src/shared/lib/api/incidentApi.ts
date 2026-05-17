// src/shared/lib/api/incidentApi.ts

import { apiClient } from './apiClient';
import type {
  Incident,
  IncidentStatistics,
  ResolveIncidentRequest,
  CreateCaseFromIncidentsRequest,
  IncidentFilter,
  ManagerWorkload,
  IncidentDistribution,
  ReassignIncidentRequest,
  EscalateIncidentRequest,
  IncidentAssignment,
  IncidentViewDto,
  UserBasicInfo,
  AssignToMeResponse,
  IncidentReportsPageResult,
  IncidentReportItem,
  IncidentReportFinding,
  IncidentReportCase,
  IncidentSummaryStats,
} from '@shared/types/incidentTypes';
import type { Case } from '@shared/types/caseTypes';

export class IncidentApi {
  private static readonly workflowServiceBaseUrl =
    import.meta.env.VITE_WORKFLOW_SERVICE_BASE_URL || 'http://localhost:8081';

  private static stringifyUnknown(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  }

  private static normalizeStatus(status: unknown): Incident['status'] {
    if (typeof status !== 'string') return 'NEW';
    const upper = status.toUpperCase();
    const normalized =
      upper === 'PARTLY_PROGGRESS' || upper === 'PARTLY_PROGRESS' ? 'PARTLY_PROGRESS' : upper;
    const statusMap: Record<string, Incident['status']> = {
      NEW: 'NEW',
      OPEN: 'NEW',
      ASSIGNED: 'ASSIGNED',
      PARTLY_PROGRESS: 'PARTLY_PROGRESS',
      IN_PROGRESS: 'IN_REVIEW',
      IN_REVIEW: 'IN_REVIEW',
      RESOLVED: 'RESOLVED',
      CLOSED: 'RESOLVED',
      FALSE_POSITIVE: 'FALSE_POSITIVE',
      ESCALATED_TO_CASE: 'ESCALATED_TO_CASE',
    };

    return statusMap[normalized] || 'NEW';
  }

  /** null, пустая строка или {} в API означают «кейс ещё не создан» */
  private static normalizeEmployeeCaseId(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object' && Object.keys(value as object).length === 0) return null;
    return null;
  }

  private static normalizeSeverity(severity: unknown): Incident['severity'] {
    if (typeof severity !== 'string') return 'LOW';
    const normalized = severity.toUpperCase();
    if (
      normalized === 'LOW' ||
      normalized === 'MEDIUM' ||
      normalized === 'HIGH' ||
      normalized === 'CRITICAL'
    ) {
      return normalized;
    }
    return 'LOW';
  }

  private static normalizeIncident(incident: Partial<Incident>): Incident {
    const riskObjectName = typeof incident.riskObjectName === 'string' ? incident.riskObjectName : '';
    const incidentDescription =
      typeof incident.incidentDescription === 'string' ? incident.incidentDescription : '';
    const detectedAt =
      typeof incident.detectedAt === 'string' && incident.detectedAt.length > 0
        ? incident.detectedAt
        : new Date().toISOString();
    const resolvedAt =
      typeof incident.resolvedAt === 'string' && incident.resolvedAt.length > 0
        ? incident.resolvedAt
        : typeof (incident as Partial<Incident> & { resolved_date?: unknown }).resolved_date === 'string'
          ? (incident as Partial<Incident> & { resolved_date?: string }).resolved_date
          : undefined;

    const rawEmployees = incident.employees;
    const employees: Incident['employees'] = Array.isArray(rawEmployees)
      ? rawEmployees
          .map((e) => {
            if (e && typeof e === 'object' && 'userId' in e) {
              const uid = (e as { userId: unknown }).userId;
              return typeof uid === 'string' ? { userId: uid } : null;
            }
            if (e && typeof e === 'object' && 'id' in e) {
              const uid = (e as { id: unknown }).id;
              return typeof uid === 'string' ? { userId: uid } : null;
            }
            return null;
          })
          .filter((e): e is { userId: string } => e !== null)
      : undefined;

    const rawCases = (incident as Partial<Incident> & { cases?: unknown }).cases;
    const cases: Incident['cases'] = Array.isArray(rawCases)
      ? rawCases
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const rec = item as Record<string, unknown>;
            const id =
              typeof rec.id === 'string'
                ? rec.id
                : typeof rec.id === 'number' || typeof rec.id === 'boolean'
                  ? String(rec.id)
                  : '';
            if (!id) return null;
            return {
              id,
              caseId: this.normalizeEmployeeCaseId(rec.caseId),
            };
          })
          .filter((c): c is NonNullable<Incident['cases']>[number] => c !== null)
      : undefined;

    return {
      id: incident.id || '',
      riskObjectId: incident.riskObjectId,
      riskObjectName: incident.riskObjectName,
      incidentDescription: incident.incidentDescription,
      categoryId: incident.categoryId,
      categoryName: incident.categoryName,
      title: incident.title || riskObjectName || 'Инцидент',
      description: incident.description || incidentDescription || '-',
      status: this.normalizeStatus(incident.status),
      severity: this.normalizeSeverity(incident.severity),
      category: incident.category || 'COMPLIANCE',
      ruleId: incident.ruleId || '',
      ruleName: incident.ruleName || '-',
      ruleExpression: incident.ruleExpression,
      assignedTo: incident.assignedTo || '',
      assignedToName: incident.assignedToName || '',
      employees: employees?.length ? employees : undefined,
      cases: cases?.length ? cases : undefined,
      detectedAt,
      createdAt: incident.createdAt || detectedAt,
      updatedAt: incident.updatedAt || detectedAt,
      resolvedAt,
      caseId: incident.caseId,
      caseTitle: incident.caseTitle,
      sourceSystem: incident.sourceSystem || '-',
      sourceEventId: incident.sourceEventId || '',
      payloadJson: incident.payloadJson,
      vendorId: incident.vendorId,
      vendorName: incident.vendorName,
      amount: incident.amount,
      departmentId: incident.departmentId,
      resolutionNotes: incident.resolutionNotes,
      falsePositiveReason: incident.falsePositiveReason,
    };
  }

  /**
   * Получить все инциденты текущего пользователя
   */
  static async getMyIncidents(filter?: IncidentFilter): Promise<Incident[]> {
    const params = new URLSearchParams();
    
    if (filter) {
      if (filter.status?.length) params.append('status', filter.status.join(','));
      if (filter.severity?.length) params.append('severity', filter.severity.join(','));
      if (filter.category?.length) params.append('category', filter.category.join(','));
      if (filter.dateFrom) params.append('dateFrom', filter.dateFrom);
      if (filter.dateTo) params.append('dateTo', filter.dateTo);
      if (filter.searchQuery) params.append('q', filter.searchQuery);
    }
    
    const response = await apiClient.get<Partial<Incident>[]>(`/api/incidents/my?${params.toString()}`);
    return response.data.map((incident) => this.normalizeIncident(incident));
  }

  /** categoryId в ответе может быть строкой или объектом (в т.ч. пустым {}) */
  private static parseStatsCategoryId(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const t = value.trim();
      return t.length > 0 ? t : null;
    }
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'object' && value !== null && Object.keys(value as object).length === 0) {
      return null;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Статистика инцидентов: GET /api/incidents/my/stats (для EXECUTIVE — компания целиком).
   */
  static async getIncidentStatistics(): Promise<IncidentStatistics> {
    const response = await apiClient.get<unknown>('/api/incidents/my/stats');
    const payload = (response.data ?? {}) as Record<string, unknown>;

    const rawBySeverity =
      payload.bySeverity && typeof payload.bySeverity === 'object'
        ? (payload.bySeverity as Record<string, unknown>)
        : {};
    const rawByCategory = Array.isArray(payload.byCategory) ? payload.byCategory : [];

    const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

    const newC = n(payload.new);
    const assignedC = n(payload.assigned);
    const inReviewC = n(payload.inReview);
    const resolvedC = n(payload.resolved);

    const low = n(rawBySeverity.low);
    const medium = n(rawBySeverity.medium);
    const high = n(rawBySeverity.high);
    const criticalSev = n(rawBySeverity.critical);

    const byCategory = rawByCategory.map((entry) => {
      const value = (entry ?? {}) as Record<string, unknown>;
      const cid = this.parseStatsCategoryId(value.categoryId);
      return {
        categoryId: cid,
        categoryName:
          typeof value.categoryName === 'string' && value.categoryName.trim().length > 0
            ? value.categoryName.trim()
            : 'Без категории',
        incidentCount: n(value.incidentCount),
      };
    });
    byCategory.sort((a, b) => a.categoryName.localeCompare(b.categoryName, 'ru'));

    const totalIncidents =
      typeof payload.totalIncidents === 'number' ? n(payload.totalIncidents) : newC + assignedC + inReviewC + resolvedC;
    const criticalIncidents =
      typeof payload.criticalIncidents === 'number' ? n(payload.criticalIncidents) : high;

    return {
      totalIncidents,
      totalFindings: typeof payload.totalFindings === 'number' ? n(payload.totalFindings) : 0,
      totalCases: typeof payload.totalCases === 'number' ? n(payload.totalCases) : 0,
      new: newC,
      assigned: assignedC,
      inReview: inReviewC,
      resolved: resolvedC,
      bySeverity: {
        low,
        medium,
        high,
        critical: criticalSev > 0 ? criticalSev : undefined,
      },
      byCategory,
      avgResolutionTime: n(payload.avgResolutionTime),
      criticalIncidents,
      overdueActionPlans: n(payload.overdueActionPlans),
      pendingVerifications: n(payload.pendingVerifications),
    };
  }

  /**
   * Получить инцидент по ID
   */
  static async getIncident(incidentId: string): Promise<Incident> {
    const response = await apiClient.get<Incident>(`/incidents/${incidentId}`);
    return response.data;
  }

  /**
   * Разрешить инцидент (закрыть как ложное срабатывание или решенный)
   */
  static async resolveIncident(
    incidentId: string, 
    data: ResolveIncidentRequest
  ): Promise<Incident> {
    const response = await apiClient.post<Incident>(
      `/incidents/${incidentId}/resolve`, 
      data
    );
    return response.data;
  }

  /**
   * Создать случай из инцидентов
   */
  static async createCaseFromIncidents(
    data: CreateCaseFromIncidentsRequest
  ): Promise<Case> {
    const response = await apiClient.post<Case>('/incidents/create-case', data);
    return response.data;
  }

  /**
   * Взять инцидент в работу
   */
  static async assignToMe(incidentId: string): Promise<AssignToMeResponse> {
    const response = await apiClient.post<AssignToMeResponse>(`/api/incidents/${incidentId}/assign-to-me`);
    return response.data;
  }

  /**
   * Получить похожие инциденты (для группировки)
   */
  static async getSimilarIncidents(incidentId: string): Promise<Incident[]> {
    const response = await apiClient.get<Incident[]>(`/incidents/${incidentId}/similar`);
    return response.data;
  }

  /**
   * Получить детальный просмотр инцидента (view DTO)
   */
  static async getIncidentView(incidentId: string): Promise<IncidentViewDto> {
    const response = await apiClient.get<IncidentViewDto>(`/api/incidents/${incidentId}/view`);
    return response.data;
  }

  /**
   * Получить базовую информацию о пользователе из user-service
   */
  static async getUserBasicInfo(userId: string): Promise<UserBasicInfo> {
    const response = await apiClient.get<UserBasicInfo>(`/api/users/${userId}/basic-info`);
    return response.data;
  }

  /**
   * Получить нагрузку всех менеджеров (только для руководителя)
   */
  static async getManagersWorkload(): Promise<ManagerWorkload[]> {
    const response = await apiClient.get<ManagerWorkload[]>('/incidents/managers-workload');
    return response.data;
  }

  /**
   * Получить распределение инцидентов по менеджерам
   */
  static async getIncidentDistribution(): Promise<IncidentDistribution[]> {
    const response = await apiClient.get<IncidentDistribution[]>('/incidents/distribution');
    return response.data;
  }

  /**
   * Переназначить инцидент другому менеджеру
   */
  static async reassignIncident(
    incidentId: string,
    data: ReassignIncidentRequest
  ): Promise<Incident> {
    const response = await apiClient.post<Incident>(
      `/incidents/${incidentId}/reassign`,
      data
    );
    return response.data;
  }

  /**
   * Эскалировать инцидент топ-менеджменту
   */
  static async escalateIncident(
    incidentId: string,
    data: EscalateIncidentRequest
  ): Promise<Incident> {
    const response = await apiClient.post<Incident>(
      `/incidents/${incidentId}/escalate`,
      data
    );
    return response.data;
  }

  /**
   * Получить историю переназначений инцидента
   */
  static async getIncidentAssignmentHistory(incidentId: string): Promise<IncidentAssignment[]> {
    const response = await apiClient.get<IncidentAssignment[]>(
      `/incidents/${incidentId}/assignment-history`
    );
    return response.data;
  }

  private static normalizeReportCase(raw: unknown): IncidentReportCase {
    if (!raw || typeof raw !== 'object') {
      return {
        id: '',
        incidentId: '',
        findingId: '',
        status: 'UNKNOWN',
        comments: [],
        attachments: [],
      };
    }
    const value = raw as Record<string, unknown>;
    const comments = Array.isArray(value.comments) ? value.comments : [];
    const attachments = Array.isArray(value.attachments) ? value.attachments : [];
    const actionPlanRaw = value.actionPlan;
    const actionPlan =
      actionPlanRaw && typeof actionPlanRaw === 'object'
        ? {
            id: this.stringifyUnknown((actionPlanRaw as Record<string, unknown>).id),
            incidentId: this.stringifyUnknown((actionPlanRaw as Record<string, unknown>).incidentId),
            caseId: this.stringifyUnknown((actionPlanRaw as Record<string, unknown>).caseId),
            title: (actionPlanRaw as Record<string, unknown>).title,
            description: (actionPlanRaw as Record<string, unknown>).description,
            comment: (actionPlanRaw as Record<string, unknown>).comment,
            verification:
              (actionPlanRaw as Record<string, unknown>).verification &&
              typeof (actionPlanRaw as Record<string, unknown>).verification === 'object'
                ? {
                    id: this.stringifyUnknown(
                      ((actionPlanRaw as Record<string, unknown>).verification as Record<string, unknown>).id
                    ),
                    actionPlanId: this.stringifyUnknown(
                      ((actionPlanRaw as Record<string, unknown>).verification as Record<string, unknown>)
                        .actionPlanId
                    ),
                    verified: Boolean(
                      ((actionPlanRaw as Record<string, unknown>).verification as Record<string, unknown>).verified
                    ),
                    assignedUserForVerification: this.stringifyUnknown(
                      ((actionPlanRaw as Record<string, unknown>).verification as Record<string, unknown>)
                        .assignedUserForVerification
                    ),
                    assignedEmployeeForVerification: this.stringifyUnknown(
                      ((actionPlanRaw as Record<string, unknown>).verification as Record<string, unknown>)
                        .assignedEmployeeForVerification
                    ),
                    comments:
                      ((actionPlanRaw as Record<string, unknown>).verification as Record<string, unknown>).comments,
                  }
                : undefined,
            tasks: Array.isArray((actionPlanRaw as Record<string, unknown>).tasks)
              ? ((actionPlanRaw as Record<string, unknown>).tasks as unknown[]).map((task) => {
                  const taskValue = (task ?? {}) as Record<string, unknown>;
                  return {
                    id: this.stringifyUnknown(taskValue.id),
                    title: this.stringifyUnknown(taskValue.title),
                    description: this.stringifyUnknown(taskValue.description),
                    priority: this.stringifyUnknown(taskValue.priority),
                    dueDate: this.stringifyUnknown(taskValue.dueDate),
                    status: this.stringifyUnknown(taskValue.status),
                    evidenceDescriptionInprogress: taskValue.evidenceDescriptionInprogress,
                    evidenceDescriptionDone: taskValue.evidenceDescriptionDone,
                    completedAt: taskValue.completedAt,
                    evidences: Array.isArray(taskValue.evidences)
                      ? (taskValue.evidences as unknown[]).map((evidence) => {
                          const evidenceValue = (evidence ?? {}) as Record<string, unknown>;
                          return {
                            id: this.stringifyUnknown(evidenceValue.id),
                            userId: this.stringifyUnknown(evidenceValue.userId),
                            fileId: this.stringifyUnknown(evidenceValue.fileId),
                            name: this.stringifyUnknown(evidenceValue.name),
                            time: this.stringifyUnknown(evidenceValue.time),
                          };
                        })
                      : [],
                  };
                })
              : [],
          }
        : undefined;

    return {
      id: this.stringifyUnknown(value.id),
      incidentId: this.stringifyUnknown(value.incidentId),
      findingId: this.stringifyUnknown(value.findingId),
      assignedUserId: value.assignedUserId,
      status: this.stringifyUnknown(value.status) || 'UNKNOWN',
      investigation:
        value.investigation && typeof value.investigation === 'object'
          ? {
              id: this.stringifyUnknown((value.investigation as Record<string, unknown>).id),
              caseId: this.stringifyUnknown((value.investigation as Record<string, unknown>).caseId),
              investigationNotes: this.stringifyUnknown(
                (value.investigation as Record<string, unknown>).investigationNotes
              ),
              rootCause: this.stringifyUnknown((value.investigation as Record<string, unknown>).rootCause),
              requiresCorrectiveAction: Boolean(
                (value.investigation as Record<string, unknown>).requiresCorrectiveAction
              ),
              createdAt: this.stringifyUnknown((value.investigation as Record<string, unknown>).createdAt),
              updatedAt: this.stringifyUnknown((value.investigation as Record<string, unknown>).updatedAt),
            }
          : undefined,
      comments: comments.map((comment) => {
        const commentValue = (comment ?? {}) as Record<string, unknown>;
        return {
          id: this.stringifyUnknown(commentValue.id),
          userId: this.stringifyUnknown(commentValue.userId),
          firstName: this.stringifyUnknown(commentValue.firstName),
          lastName: this.stringifyUnknown(commentValue.lastName),
          comment: this.stringifyUnknown(commentValue.comment),
          time: this.stringifyUnknown(commentValue.time),
        };
      }),
      attachments: attachments.map((attachment) => {
        const attachmentValue = (attachment ?? {}) as Record<string, unknown>;
        return {
          id: this.stringifyUnknown(attachmentValue.id),
          userId: this.stringifyUnknown(attachmentValue.userId),
          firstName: this.stringifyUnknown(attachmentValue.firstName),
          lastName: this.stringifyUnknown(attachmentValue.lastName),
          fileId: this.stringifyUnknown(attachmentValue.fileId),
          name: this.stringifyUnknown(attachmentValue.name),
          size: typeof attachmentValue.size === 'number' ? attachmentValue.size : 0,
          time: this.stringifyUnknown(attachmentValue.time),
        };
      }),
      actionPlan,
    };
  }

  private static normalizeReportFinding(raw: unknown): IncidentReportFinding {
    if (!raw || typeof raw !== 'object') {
      return {
        id: '',
        priority: '',
        assignedUserId: undefined,
        ruleName: undefined,
        details: {},
        cases: [],
      };
    }
    const value = raw as Record<string, unknown>;
    return {
      id: this.stringifyUnknown(value.id),
      priority: this.stringifyUnknown(value.priority),
      assignedUserId: value.assignedUserId,
      ruleName: value.ruleName,
      details: value.details && typeof value.details === 'object' ? (value.details as Record<string, unknown>) : {},
      cases: Array.isArray(value.cases) ? value.cases.map((caseItem) => this.normalizeReportCase(caseItem)) : [],
    };
  }

  private static normalizeReportItem(raw: unknown): IncidentReportItem {
    const value = (raw ?? {}) as Record<string, unknown>;
    const incidentValue =
      value.incident && typeof value.incident === 'object'
        ? (value.incident as Record<string, unknown>)
        : {};
    return {
      incident: {
        id: this.stringifyUnknown(incidentValue.id),
        companyId: this.stringifyUnknown(incidentValue.companyId),
        integrationId: typeof incidentValue.integrationId === 'number' ? incidentValue.integrationId : 0,
        riskObjectId: this.stringifyUnknown(incidentValue.riskObjectId),
        riskObjectName: incidentValue.riskObjectName,
        documentId: incidentValue.documentId,
        integrationName: incidentValue.integrationName,
        status: this.stringifyUnknown(incidentValue.status) || 'UNKNOWN',
      },
      findings: Array.isArray(value.findings)
        ? value.findings.map((finding) => this.normalizeReportFinding(finding))
        : [],
    };
  }

  /** Полный элемент отчёта (GET .../incidents/:id/report, problem-areas) */
  static parseIncidentReportItem(raw: unknown): IncidentReportItem {
    return this.normalizeReportItem(raw);
  }

  static async getIncidentReports(
    page: number,
    limit: number,
    filters?: { incidentId?: string; documentId?: string; status?: string }
  ): Promise<IncidentReportsPageResult> {
    const incidentId = filters?.incidentId?.trim();
    const documentId = filters?.documentId?.trim();
    const status = filters?.status?.trim();

    const response = await apiClient.get<unknown>('/api/incidents/reports', {
      params: {
        page,
        limit,
        ...(incidentId ? { incidentId } : {}),
        ...(documentId ? { documentId } : {}),
        ...(status ? { status } : {}),
      },
    });
    const payload = (response.data ?? {}) as Record<string, unknown>;
    const items = Array.isArray(payload.items)
      ? payload.items.map((item) => this.normalizeReportItem(item))
      : [];
    return {
      items,
      page: typeof payload.page === 'number' ? payload.page : page,
      limit: typeof payload.limit === 'number' ? payload.limit : limit,
      total: typeof payload.total === 'number' ? payload.total : items.length,
      totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 0,
    };
  }

  static async getIncidentSummaryStats(): Promise<IncidentSummaryStats> {
    const response = await apiClient.get<unknown>(`${this.workflowServiceBaseUrl}/api/incidents/my/stats`);
    const payload = (response.data ?? {}) as Record<string, unknown>;

    return {
      totalIncidents: typeof payload.totalIncidents === 'number' ? payload.totalIncidents : 0,
      totalFindings: typeof payload.totalFindings === 'number' ? payload.totalFindings : 0,
      totalCases: typeof payload.totalCases === 'number' ? payload.totalCases : 0,
    };
  }
}
