import type { IncidentReportItem, UserBasicInfo } from '@shared/types/incidentTypes';

/** Имя из вложенного объекта assignedUserId (если бэкенд уже отдал профиль). */
export function getEmbeddedAssigneeDisplayName(assignedUserId: unknown): string | null {
  if (!assignedUserId || typeof assignedUserId !== 'object') return null;
  const record = assignedUserId as Record<string, unknown>;
  const firstName = typeof record.firstName === 'string' ? record.firstName.trim() : '';
  const lastName = typeof record.lastName === 'string' ? record.lastName.trim() : '';
  const fromParts = `${firstName} ${lastName}`.trim();
  if (fromParts) return fromParts;
  if (typeof record.fullName === 'string' && record.fullName.trim()) return record.fullName.trim();
  if (typeof record.username === 'string' && record.username.trim()) return record.username.trim();
  return null;
}

/** userId из case.assignedUserId (строка или объект с id / userId). */
export function extractCaseAssigneeUserId(assignedUserId: unknown): string | null {
  if (typeof assignedUserId === 'string') {
    const id = assignedUserId.trim();
    return id || null;
  }
  if (!assignedUserId || typeof assignedUserId !== 'object') return null;
  if (getEmbeddedAssigneeDisplayName(assignedUserId)) return null;

  const record = assignedUserId as Record<string, unknown>;
  for (const key of ['id', 'userId'] as const) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function formatUserBasicInfoDisplayName(user: UserBasicInfo): string {
  const fromParts = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (fromParts) return fromParts;
  if (user.fullName?.trim()) return user.fullName.trim();
  if (user.username?.trim()) return user.username.trim();
  if (user.email?.trim()) return user.email.trim();
  return '';
}

export function collectCaseAssigneeUserIds(items: IncidentReportItem[]): string[] {
  const ids = new Set<string>();
  for (const item of items) {
    for (const finding of item.findings) {
      for (const caseItem of finding.cases) {
        const userId = extractCaseAssigneeUserId(caseItem.assignedUserId);
        if (userId) ids.add(userId);
      }
    }
  }
  return Array.from(ids);
}
