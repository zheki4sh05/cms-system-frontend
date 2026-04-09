import { apiClient } from './apiClient';
import type { CompanyProfile, UpdateCompanyRequest } from '@shared/types/companyTypes';

export class CompanyApi {
  static async getCompany(): Promise<CompanyProfile> {
    const storedUser = localStorage.getItem('user');
    let employeeId: string | null = null;

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as { employeeId?: string };
        employeeId = parsedUser.employeeId ?? null;
      } catch (error) {
        console.error('Failed to parse user data for EmployeeId header:', error);
      }
    }

    const response = await apiClient.get<CompanyProfile>('/company', {
      headers: employeeId ? { EmployeeId: employeeId } : undefined,
    });
    return response.data;
  }

  static async updateCompany(data: UpdateCompanyRequest): Promise<CompanyProfile> {
    const response = await apiClient.patch<CompanyProfile>('/company', data);
    return response.data;
  }
}
