export type UserRole = 'MANAGER' | 'SUPERVISOR' | 'EXECUTIVE';

export const UserRoleValues: Record<UserRole, UserRole> = {
  MANAGER: 'MANAGER',
  SUPERVISOR: 'SUPERVISOR',
  EXECUTIVE: 'EXECUTIVE',
};

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  employeeId?: string;
  companyId?: string;
  departmentId?: string;
  /** Подгружается после логина: GET /departments/{departmentId} */
  departmentName?: string;
  isFirstLogin?: boolean;
  /** Из GET /api/users/me — показ ссылки на админ-панель */
  hasAdminAccess?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  companyName?: string;
}


export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  employeeId?: string;
}