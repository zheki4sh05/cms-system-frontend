import { apiClient } from './apiClient';
import type { 
  Department,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  TransferEmployeeRequest,
} from '@shared/types/departmentTypes';

export class DepartmentApi {
  /** Департаменты компании по id компании */
  static async getDepartmentsByCompanyId(companyId: string): Promise<Department[]> {
    const response = await apiClient.get<Department[]>(
      `/companies/${encodeURIComponent(companyId)}/departments`
    );
    return response.data;
  }

  // Получение департамента по ID
  static async getDepartment(id: string): Promise<Department> {
    const response = await apiClient.get<Department>(`/departments/${id}`);
    return response.data;
  }

  // Создание департамента (только Executive)
  static async createDepartment(data: CreateDepartmentRequest): Promise<Department> {
    const response = await apiClient.post<Department>('/departments', data);
    return response.data;
  }

  // Обновление департамента (только Executive)
  static async updateDepartment(id: string, data: UpdateDepartmentRequest): Promise<Department> {
    const response = await apiClient.patch<Department>(`/departments/${id}`, data);
    return response.data;
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
  static async assignManager(departmentId: string, managerId: string): Promise<Department> {
    const response = await apiClient.post<Department>(
      `/departments/${departmentId}/manager`,
      { managerId }
    );
    return response.data;
  }
}