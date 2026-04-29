// src/shared/types/case.types.ts

export enum CaseStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  INVESTIGATION = 'INVESTIGATION',
  ACTION_PLAN = 'ACTION_PLAN',
  ACTION_IN_PROGRESS = 'ACTION_IN_PROGRESS',
  WAITING_VERIFICATION = 'WAITING_VERIFICATION',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
  ESCALATED_TO_CASE = 'ESCALATED_TO_CASE'
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

export interface UpdateInvestigationRequest {
  investigationNotes: string;
  rootCause: string;
  requiresCorrectiveAction: boolean;
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

// Обновить src/shared/types/case.types.ts - добавить новые поля

export interface VerificationDecision {
  approved: boolean;
  comments: string;
  rejectionReason?: string;
  recommendations?: string[];
  followUpRequired?: boolean;
}

export interface CaseVerificationDetails {
  caseId: string;
  actionPlanId?: string;
  
  // Детали для верификации
  investigationSummary: string;
  rootCauseAnalysis: string;
  evidenceProvided: string[];
  
  // План корректирующих действий
  proposedActions: {
    taskTitle: string;
    description: string;
    assignee: string;
    dueDate: string;
    status: string;
  }[];
  
  // Метрики
  estimatedImpact: string;
  preventiveMeasures: string;
  resourcesRequired: string;
  
  // Статус проверки
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
}
