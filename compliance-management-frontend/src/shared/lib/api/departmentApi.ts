import { apiClient } from './apiClient';
import type { 
  Department,
  DepartmentDetails,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  TransferEmployeeRequest,
} from '@shared/types/departmentTypes';

type DepartmentApiResponse = Department & {
  supervisorId?: string;
  supervisorName?: string;
};

type DepartmentDetailsApiResponse = DepartmentApiResponse & {
  employees?: DepartmentDetails['employees'];
};

export class DepartmentApi {
  private static normalizeDepartment(data: DepartmentApiResponse): Department {
    return {
      ...data,
      managerId: data.managerId ?? data.supervisorId,
      managerName: data.managerName ?? data.supervisorName,
      supervisorId: data.supervisorId ?? data.managerId,
      supervisorName: data.supervisorName ?? data.managerName,
    };
  }

  private static getCompanyIdForHeader(explicitCompanyId?: string): string | undefined {
    if (explicitCompanyId) {
      return explicitCompanyId;
    }

    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        return undefined;
      }

      const user = JSON.parse(rawUser) as { companyId?: string };
      return user.companyId;
    } catch {
      return undefined;
    }
  }

  /** Департаменты компании по id компании */
  static async getDepartmentsByCompanyId(companyId: string): Promise<Department[]> {
    const response = await apiClient.get<DepartmentApiResponse[]>(
      `/companies/${encodeURIComponent(companyId)}/departments`
    );
    return response.data.map((item) => this.normalizeDepartment(item));
  }

  // Получение департамента по ID
  static async getDepartment(id: string): Promise<DepartmentDetails> {
    const response = await apiClient.get<DepartmentDetailsApiResponse>(`/departments/${id}`);
    const normalizedDepartment = this.normalizeDepartment(response.data);
    return {
      ...normalizedDepartment,
      employees: response.data.employees ?? [],
    };
  }

  // Создание департамента (только Executive)
  static async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    const response = await apiClient.post<DepartmentApiResponse>('/departments', data);
    return this.normalizeDepartment(response.data);
  }

  // Обновление департамента (только Executive)
  static async updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    const response = await apiClient.patch<DepartmentApiResponse>(`/departments/${id}`, data);
    return this.normalizeDepartment(response.data);
  }

  // Удаление департамента (только Executive)
  static async deleteDepartment(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  }

  // Перевод сотрудника между департаментами (только Executive)
  static async transferEmployee(data: TransferEmployeeRequest): Promise<void> {
    await apiClient.post('/departments/transfer', data);
  }

  // Назначение руководителя департамента (только Executive)
  static async assignManager(
    departmentId: string,
    managerId: string,
    companyId?: string
  ): Promise<Department> {
    const resolvedCompanyId = this.getCompanyIdForHeader(companyId);
    const response = await apiClient.post<DepartmentApiResponse>(
      `/departments/${departmentId}/supervisor`,
      { managerId },
      {
        headers: resolvedCompanyId
          ? { CompanyId: resolvedCompanyId }
          : undefined,
      }
    );
    return this.normalizeDepartment(response.data);
  }
}