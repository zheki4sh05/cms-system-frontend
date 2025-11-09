import { type UserRole } from './customTypes';

export interface InvitationRequest {
  email: string;
  role: UserRole;
  departmentId?: string;
  invitedBy: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  invitedBy: string;
  invitedByName: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export enum InvitationStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface InvitationResponse {
  invitation: Invitation;
  message: string;
}