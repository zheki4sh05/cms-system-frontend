
import type { FC, ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@features/auth/useAuthStore';
import { type UserRole } from '@shared/types/customTypes';
import { UserRoleValues } from '@shared/types/customTypes';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: FC<ProtectedRouteProps> = observer(
  ({ children, allowedRoles }) => {
    const authStore = useAuthStore();
    const location = useLocation();

    // Проверка аутентификации
    if (!authStore.isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Проверка ролей, если они указаны
    if (allowedRoles && authStore.userRole) {
      if (!allowedRoles.includes(authStore.userRole)) {
        // Редирект на дашборд соответствующей роли
        const dashboardPath = getRoleDashboardPath(authStore.userRole);
        return <Navigate to={dashboardPath} replace />;
      }
    }

    return <>{children}</>;
  }
);

// Вспомогательная функция для получения пути дашборда по роли
function getRoleDashboardPath(role: UserRole): string {
  switch (role) {
    case UserRoleValues.MANAGER:
      return '/manager/dashboard';
    case UserRoleValues.SUPERVISOR:
      return '/supervisor/dashboard';
    case UserRoleValues.EXECUTIVE:
      return '/executive/dashboard';
    default:
      return '/';
  }
}