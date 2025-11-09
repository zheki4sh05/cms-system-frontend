
import type { FC, ReactNode } from 'react';
import { observer } from 'mobx-react-lite';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@features/auth/useAuthStore';
import { UserRoleValues } from '@shared/types/customTypes';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
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
        let targetPath = "dashboard";

        if(authStore.isFirstLogin){
          targetPath =  getRolePath(authStore.userRole, "help");
        }else{
          targetPath =  getRolePath(authStore.userRole, "dashboard");
        }
      
        return <Navigate to={targetPath} replace />;
      }
    }

    return <>{children}</>;
  }
);

// Вспомогательная функция для получения пути дашборда по роли
function getRolePath(role: string, source: string): string {
  switch (role) {
    case UserRoleValues.MANAGER:
      return '/manager/'+source;
    case UserRoleValues.SUPERVISOR:
      return '/supervisor/'+source;
    case UserRoleValues.EXECUTIVE:
      return '/executive/'+source;
    default:
      return '/';
  }
}