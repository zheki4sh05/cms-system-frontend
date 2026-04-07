import { apiClient } from './apiClient';
import type { CompanyProfile, UpdateCompanyRequest } from '@shared/types/companyTypes';

export class CompanyApi {
  static async getCompany(): Promise<CompanyProfile> {
    const response = await apiClient.get<CompanyProfile>('/company');
    return response.data;
  }

  static async updateCompany(data: UpdateCompanyRequest): Promise<CompanyProfile> {
    const response = await apiClient.patch<CompanyProfile>('/company', data);
    return response.data;
  }
}
