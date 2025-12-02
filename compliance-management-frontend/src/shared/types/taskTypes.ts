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
  caseTitle: string;
  
  title: string;
  description: string;
  
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  
  createdBy: string;
  createdByName: string;
  createdAt: string;
  
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  
  rejectionReason?: string;
  
  tasks: Task[];
  
  // Прогресс
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
}

export interface CreateActionPlanRequest {
  caseId: string;
  title: string;
  description: string;
  tasks: CreateTaskRequest[];
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
