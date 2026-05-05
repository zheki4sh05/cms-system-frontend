export const INCIDENT_STATUS_LABELS_RU: Record<string, string> = {
  NEW: 'Новый',
  OPEN: 'Открыт',
  ASSIGNED: 'Назначен',
  PARTLY_PROGRESS: 'Частично обрабатывается',
  IN_PROGRESS: 'В процессе',
  IN_REVIEW: 'На проверке',
  RESOLVED: 'Решен',
  FALSE_POSITIVE: 'Ложное срабатывание',
  ESCALATED_TO_CASE: 'Эскалирован в случай',
};

export const CASE_STATUS_LABELS_RU: Record<string, string> = {
  OPEN: 'Открыт',
  ASSIGNED: 'Назначен',
  IN_PROGRESS: 'В процессе',
  INVESTIGATING: 'Расследование',
  ACTION_PLAN: 'План действий',
  ACTION_IN_PROGRESS: 'Исполнение мероприятий',
  WAITING_VERIFICATION: 'Ожидание проверки',
  CLOSED: 'Завершен',
  REJECTED: 'Отклонен',
  ESCALATED_TO_CASE: 'Эскалация',
};

export function getIncidentStatusLabelRu(status: string): string {
  return INCIDENT_STATUS_LABELS_RU[status.toUpperCase()] ?? status;
}

export function getCaseStatusLabelRu(status: string): string {
  return CASE_STATUS_LABELS_RU[status.toUpperCase()] ?? status;
}
