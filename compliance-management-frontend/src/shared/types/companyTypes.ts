export interface CompanyProfile {
  id: string;
  name: string;
  employeeCount: number;
}

export interface UpdateCompanyRequest {
  name: string;
}
