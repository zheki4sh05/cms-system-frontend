import { apiClient } from './apiClient';
import type { User } from '@shared/types/customTypes';

export class EmployeeApi {
  static async getEmployeesByCompanyId(companyId: string): Promise<User[]> {
    const response = await apiClient.get<User[]>(
      `/companies/${encodeURIComponent(companyId)}/employees`
    );
    return response.data;
  }
}
