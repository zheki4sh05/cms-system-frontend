export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  managerName?: string;
  supervisorId?: string;
  supervisorName?: string;
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
  managerId?: string;
  companyId?: string;
}

export interface UpdateDepartmentRequest {
  name?: string;
  description?: string;
  managerId?: string;
}

export interface TransferEmployeeRequest {
  employeeId: string;
  fromDepartmentId: string;
  toDepartmentId: string;
}