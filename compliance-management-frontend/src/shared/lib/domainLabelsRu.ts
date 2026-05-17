/**
 * Отображаемые подписи для доменных кодов (англ. → рус.).
 * Значения с бэкенда нормализуются через toUpperCase / toLowerCase где уместно.
 */

const SEVERITY_RU: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  CRITICAL: 'Критичный',
};

export function getSeverityLabelRu(severity: string | undefined | null): string {
  if (severity == null || severity === '') return '—';
  const key = String(severity).trim().toUpperCase();
  return SEVERITY_RU[key] ?? String(severity);
}

/** Серьёзность в ж.р. (тексты вроде «критичность риска») */
const SEVERITY_FEMININE_RU: Record<string, string> = {
  LOW: 'Низкая',
  MEDIUM: 'Средняя',
  HIGH: 'Высокая',
  CRITICAL: 'Критичная',
};

export function getSeverityLabelFeminineRu(severity: string | undefined | null): string {
  if (severity == null || severity === '') return '—';
  const key = String(severity).trim().toUpperCase();
  return SEVERITY_FEMININE_RU[key] ?? String(severity);
}

/** Приоритет задач / случаев / уведомлений */
const WORKFLOW_PRIORITY_RU: Record<string, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  NORMAL: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
  CRITICAL: 'Критичный',
};

export function getWorkflowPriorityLabelRu(priority: string | undefined | null): string {
  if (priority == null || priority === '') return '—';
  const key = String(priority).trim().toUpperCase();
  return WORKFLOW_PRIORITY_RU[key] ?? String(priority);
}

const TASK_STATUS_RU: Record<string, string> = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  DONE: 'Выполнено',
  BLOCKED: 'Заблокировано',
};

export function getTaskStatusLabelRu(status: string | undefined | null): string {
  if (status == null || status === '') return '—';
  const key = String(status).trim().toUpperCase();
  return TASK_STATUS_RU[key] ?? String(status);
}

const MANAGER_WORKLOAD_RU: Record<string, string> = {
  AVAILABLE: 'Доступен',
  BUSY: 'Занят',
  OVERLOADED: 'Перегружен',
};

export function getManagerWorkloadStatusRu(status: string | undefined | null): string {
  if (status == null || status === '') return '—';
  const key = String(status).trim().toUpperCase();
  return MANAGER_WORKLOAD_RU[key] ?? String(status);
}

const INCIDENT_CATEGORY_RU: Record<string, string> = {
  FINANCIAL: 'Финансы',
  VENDOR: 'Контрагенты',
  COMPLIANCE: 'Комплаенс',
  LOGISTICS: 'Логистика',
  DATA_QUALITY: 'Качество данных',
  ETHICS: 'Этика',
};

export function getIncidentCategoryLabelRu(category: string | undefined | null): string {
  if (category == null || category === '') return '—';
  const key = String(category).trim().toUpperCase();
  return INCIDENT_CATEGORY_RU[key] ?? String(category);
}

const ESCALATION_URGENCY_RU: Record<string, string> = {
  HIGH: 'Высокая',
  CRITICAL: 'Критическая',
};

export function getEscalationUrgencyLabelRu(urgency: string | undefined | null): string {
  if (urgency == null || urgency === '') return '—';
  const key = String(urgency).trim().toUpperCase();
  return ESCALATION_URGENCY_RU[key] ?? String(urgency);
}

/** Ключи агрегата incidentsByRiskObjectSeverity (low / medium / high / unknown) */
const RISK_OBJECT_SEVERITY_BUCKET_RU: Record<string, string> = {
  low: 'Низкая',
  medium: 'Средняя',
  high: 'Высокая',
  unknown: 'Неизвестно',
};

export function getRiskObjectSeverityBucketRu(key: string | undefined | null): string {
  if (key == null || key === '') return '—';
  const k = String(key).trim().toLowerCase();
  return RISK_OBJECT_SEVERITY_BUCKET_RU[k] ?? String(key);
}

const INCIDENTS_OVERVIEW_SCOPE_SHORT_RU: Record<string, string> = {
  COMPANY: 'Компания',
  DEPARTMENT: 'Отдел',
};

export function getIncidentsOverviewScopeShortRu(scope: string | undefined | null): string {
  if (scope == null || scope === '') return '—';
  const key = String(scope).trim().toUpperCase();
  return INCIDENTS_OVERVIEW_SCOPE_SHORT_RU[key] ?? String(scope);
}

const HML_SIGNIFICANCE_RU: Record<string, string> = {
  HIGH: 'Высокая',
  MEDIUM: 'Средняя',
  LOW: 'Низкая',
};

export function getHighMediumLowLabelRu(value: string | undefined | null): string {
  if (value == null || value === '') return '—';
  const key = String(value).trim().toUpperCase();
  return HML_SIGNIFICANCE_RU[key] ?? String(value);
}

const RULE_LIFECYCLE_STATUS_RU: Record<string, string> = {
  ACTIVE: 'Активно',
  DISABLED: 'Отключено',
  DRAFT: 'Черновик',
  UNDER_REVIEW: 'На проверке',
  ARCHIVED: 'В архиве',
};

export function getRuleLifecycleStatusRu(status: string | undefined | null): string {
  if (status == null || status === '') return '—';
  const key = String(status).trim().toUpperCase();
  return RULE_LIFECYCLE_STATUS_RU[key] ?? String(status);
}

/**
 * Вес правила (priority): код LOW/MEDIUM/HIGH/CRITICAL или числовая шкала очереди (1–10).
 */
export function getRuleWeightLabelRu(priority: string | number | undefined | null): string | null {
  if (priority == null || priority === '') return null;

  const raw = String(priority).trim();
  const upper = raw.toUpperCase();
  if (SEVERITY_RU[upper]) return SEVERITY_RU[upper];
  if (WORKFLOW_PRIORITY_RU[upper]) return WORKFLOW_PRIORITY_RU[upper];

  const num = Number(raw);
  if (!Number.isNaN(num)) {
    if (num >= 9) return SEVERITY_RU.CRITICAL;
    if (num >= 7) return SEVERITY_RU.HIGH;
    if (num >= 4) return SEVERITY_RU.MEDIUM;
    if (num >= 1) return SEVERITY_RU.LOW;
  }

  return null;
}

/** Подпись для колонки «Серьёзность» в реестре правил (вес + запасной severity). */
export function getRuleDisplaySeverityLabelRu(
  priority: string | number | undefined | null,
  severity?: string | null
): string {
  return getRuleWeightLabelRu(priority) ?? getSeverityLabelRu(severity);
}
