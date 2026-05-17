

import { type FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

// Auth pages
import { LoginPage } from '@pages/auth/LoginPage/LoginPage';

// Manager pages
import { ManagerIncidentsPage } from '@pages/manager/IncidentsPage/ManagerIncidentPage';
import { ManagerCasesPage } from '@pages/manager/CasesPage/ManagerCasesPage';
import { ManagerTasksPage } from '@pages/manager/TasksPage/ManagerTasksPage';

// Supervisor pages
import { SupervisorDashboardPage } from '@pages/supervisor/DashboardPage/DashBoardPage';

// Executive pages
import { ExecutiveDashboardPage } from '@pages/executive/DashboardPage/ExecutiveDashboardPage';

// Other
import { NotFoundPage } from '@pages/NotFoundPage/NotFoundPage';
import { ProtectedRoute } from '@shared/lib/hooks/ProtectedRoute';
import { UserRoleValues } from '@shared/types/customTypes';
import { AppLayout } from '@widgets/Layout/AppLayout';
import { SupervisorRulesPage } from '@pages/supervisor/RulesPage/SupervisorRulesPage';
import { RegisterPage } from '@pages/auth/RegisterPage/RegisterPage';
import { ManagerHelpPage } from '@pages/help/ManagerHelpPage';
import { SupervisorHelpPage } from '@pages/help/SuperVisorHelpPage';
import { ExecutiveHelpPage } from '@pages/help/ExecutiveHelpPage';
import { ManagerRulesPage } from '@pages/manager/RulesPage/RulesPage';
import { ArchivePage } from '@pages/archive/ArchivePage';
import { IncidentsAndCasesPage } from '@pages/shared/IncidentsAndCasesPage/IncidentsAndCasesPage';
import { RulesPage } from '@pages/shared/RulesPage/RulesPage';

export const RouterProvider: FC = observer(() => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Manager routes with Layout */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.MANAGER]}>
              <AppLayout>
                <Routes>
                  <Route index element={<Navigate to="incidents" replace />} />
                  {/* Панель менеджера по закупкам — вернуть элемент ManagerDashboardPage, когда будет готово */}
                  <Route
                    path="dashboard"
                    element={<Navigate to="/manager/incidents" replace />}
                  />
                  <Route path="incidents" element={<ManagerIncidentsPage />} />
                 <Route path="cases" element={<ManagerCasesPage />} />
                <Route path="tasks" element={<ManagerTasksPage />} />
                  <Route path="archive" element={<ArchivePage />} />
                  <Route path="rules" element={<ManagerRulesPage />} />
                  <Route path="help" element={<ManagerHelpPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Supervisor routes with Layout */}
        <Route
          path="/supervisor/*"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.SUPERVISOR]}>
              <AppLayout>
                <Routes>
                   <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<SupervisorDashboardPage />} />
                  <Route path="incidents-cases" element={<IncidentsAndCasesPage />} />
                  <Route path="cases" element={<Navigate to="../incidents-cases" replace />} />
                  <Route path="incidents" element={<Navigate to="../incidents-cases" replace />} />
                  <Route path="analytics" element={<Navigate to="../dashboard" replace />} />
                  <Route path="archive" element={<ArchivePage />} />
                  <Route path="rules" element={<SupervisorRulesPage />} />
                  <Route path="help" element={<SupervisorHelpPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Executive routes with Layout */}
        <Route
          path="/executive/*"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.EXECUTIVE]}>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<ExecutiveDashboardPage />} />
                  <Route path="incidents-cases" element={<IncidentsAndCasesPage />} />
                  <Route path="reports" element={<Navigate to="../incidents-cases" replace />} />
                  <Route path="rules" element={<RulesPage />} />
                  <Route path="archive" element={<ArchivePage />} />
                  <Route path="help" element={<ExecutiveHelpPage />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
});
