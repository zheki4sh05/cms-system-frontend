
import { apiClient } from './apiClient';
import type { 
  InvitationRequest, 
  InvitationResponse, 
  Invitation 
} from '@shared/types/invitationTypes';

export class InvitationApi {
  // Отправка приглашения
  static async sendInvitation(data: InvitationRequest): Promise<InvitationResponse> {
    const response = await apiClient.post<InvitationResponse>('/invitations/send', data);
    return response.data;
  }

  // Получение списка отправленных приглашений
  static async getSentInvitations(): Promise<Invitation[]> {
    const response = await apiClient.get<Invitation[]>('/invitations/sent');
    return response.data;
  }

  // Получение списка полученных приглашений (для приглашенного пользователя)
  static async getReceivedInvitations(email: string): Promise<Invitation[]> {
    const response = await apiClient.get<Invitation[]>(`/invitations/received/${email}`);
    return response.data;
  }

  // Принятие приглашения
  static async acceptInvitation(invitationId: string): Promise<void> {
    await apiClient.post(`/invitations/${invitationId}/accept`);
  }

  // Отклонение приглашения
  static async rejectInvitation(invitationId: string): Promise<void> {
    await apiClient.post(`/invitations/${invitationId}/reject`);
  }

  // Отмена приглашения (отправителем)
  static async cancelInvitation(invitationId: string): Promise<void> {
    await apiClient.delete(`/invitations/${invitationId}`);
  }
}