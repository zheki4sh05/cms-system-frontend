// src/shared/types/case.types.ts

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  INVESTIGATION = 'INVESTIGATION',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum CaseSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum CasePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Case {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  severity: CaseSeverity;
  priority: CasePriority;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  incidentIds: string[]; // Связанные инциденты
  tags: string[];
  
  // Расследование
  investigationNotes?: string;
  rootCause?: string;
  requiresCorrectiveAction: boolean;
  
  // Связанный план действий
  actionPlanId?: string;
  
  // Метаданные
  departmentId?: string;
  vendorId?: string;
  amount?: number;
}

export interface CaseComment {
  id: string;
  caseId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  attachments?: CaseAttachment[];
}

export interface CaseAttachment {
  id: string;
  caseId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CreateCaseRequest {
  title: string;
  description: string;
  severity: CaseSeverity;
  priority: CasePriority;
  incidentIds?: string[];
  tags?: string[];
}

export interface UpdateCaseRequest {
  title?: string;
  description?: string;
  status?: CaseStatus;
  severity?: CaseSeverity;
  priority?: CasePriority;
  investigationNotes?: string;
  rootCause?: string;
  requiresCorrectiveAction?: boolean;
  tags?: string[];
}

export interface CaseStatistics {
  total: number;
  open: number;
  inProgress: number;
  investigation: number;
  pendingVerification: number;
  closed: number;
  avgResolutionTime: number; // В часах
}
