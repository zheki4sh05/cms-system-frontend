// src/shared/types/task.types.ts

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  BLOCKED = 'BLOCKED',
}

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  incidentId?: string;
  documentId?: unknown;
  incidentStatus?: unknown;
  comment?: unknown;
  actionPlanTitle?: unknown;
  actionPlanDescription?: unknown;
  actionPlanComment?: unknown;

  /** Ответ POST /api/action-plans */
  caseStatus?: unknown;

  // Связь с планом и случаем
  actionPlanId?: string;
  caseId?: string;
  caseTitle?: string;
  
  // Ответственные
  assigneeId: string;
  assigneeName: string;
  createdBy: string;
  createdByName: string;
  
  // Даты
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  completedAt?: string;
  
  // Доказательства выполнения
  evidenceDescription?: string;
  evidenceAttachments?: TaskAttachment[];
  evidenceDescriptionInprogress?: unknown;
  evidenceDescriptionDone?: unknown;
  
  // Статус
  isOverdue: boolean;
  daysUntilDue: number;
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
}

export interface ActionPlan {
  id: string;
  caseId: string;
  incidentId?: string;
  /** Если сервер не возвращает название случая */
  caseTitle?: string;
  /** Статус случая с сервера (например POST /api/action-plans) */
  caseStatus?: string;

  /** GET /api/action-plans — название рискового объекта */
  riskObjectName?: string;
  /** GET /api/action-plans — произвольные детали (часто как у finding в инциденте) */
  details?: Record<string, unknown>;

  title: string;
  description: string;
  comment?: string | null;

  status?: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';

  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  rejectionReason?: string;
  
  tasks: Task[];

  // Прогресс (могут отсутствовать в ответе API — тогда считаются из tasks)
  totalTasks?: number;
  completedTasks?: number;
  progressPercentage?: number;
}

export interface CreateActionPlanRequest {
  caseId: string;
  title: string;
  description: string;
  tasks: CreateTaskRequest[];
}

export interface CreateActionPlanApiRequest {
  caseId: string;
  title: string;
  description: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    dueDate: string;
  }>;
}

/** Тело PATCH /api/action-plans/{planId} */
export interface UpdateActionPlanRequest {
  title: string;
  description: string;
  comment: string | null;
}

/** Ответ POST /api/action-plans/{planId}/submit */
export interface ActionPlanInvestigationSummary {
  id: string;
  caseId: string;
  investigationNotes: string;
  rootCause: string;
  requiresCorrectiveAction: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitActionPlanResponse {
  id: string;
  incidentId?: string;
  findingId?: string;
  assignedUserId?: unknown;
  status: string;
  investigation?: ActionPlanInvestigationSummary;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
}

export interface UpdateTaskRequest {
  status?: TaskStatus;
  evidenceDescription?: string;
  evidenceAttachments?: File[];
}

export interface TaskStatistics {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  blocked: number;
  overdue: number;
  dueToday: number;
  dueTomorrow: number;
}
