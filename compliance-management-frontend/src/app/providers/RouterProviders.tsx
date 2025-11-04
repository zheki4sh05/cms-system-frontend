

import { type FC } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

// Auth pages
import { LoginPage } from '@pages/auth/LoginPage/LoginPage';

// Manager pages
import { ManagerDashboardPage } from '@pages/manager/DashboardPage/DashBoardPage';
import { ManagerIncidentsPage } from '@pages/manager/IncidentsPage/ManagerIncidentPage';
import { ManagerCasesPage } from '@pages/manager/CasesPage/ManagerCasesPage';
import { ManagerTasksPage } from '@pages/manager/TasksPage/ManagerTasksPage';

// Supervisor pages
import { SupervisorDashboardPage } from '@pages/supervisor/DashboardPage/DashBoardPage';
import { SupervisorCasesPage } from '@pages/supervisor/CasesPage/SupervisorCasesPage';
import { SupervisorIncidentsPage } from '@pages/supervisor/IncidentsPage/SupervisorIncidentsPage';
import { SupervisorAnalyticsPage } from '@pages/supervisor/AnalyticsPage/SuperVisorAnalyticsPage';

// Executive pages
import { ExecutiveDashboardPage } from '@pages/executive/DashboardPage/ExecutiveDashboardPage';
import { ExecutiveReportsPage } from '@pages/executive/ReportsPage/ExecutiveReportsPage';

// Other
import { NotFoundPage } from '@pages/NotFoundPage/NotFoundPage';
import { ProtectedRoute } from '@shared/lib/hooks/ProtectedRoute';
import { UserRoleValues } from '@shared/types/customTypes';
import { AppLayout } from '@widgets/Layout/AppLayout';
import { SupervisorRulesPage } from '@pages/supervisor/RulesPage/SupervisorRulesPage';

export const RouterProvider: FC = observer(() => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Manager routes with Layout */}
        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.MANAGER]}>
              <AppLayout>
                <Routes>
                  <Route path="dashboard" element={<ManagerDashboardPage />} />
                  <Route path="incidents" element={<ManagerIncidentsPage />} />
                  <Route path="cases" element={<ManagerCasesPage />} />
                  <Route path="tasks" element={<ManagerTasksPage />} />
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
                  <Route path="dashboard" element={<SupervisorDashboardPage />} />
                  <Route path="cases" element={<SupervisorCasesPage />} />
                  <Route path="incidents" element={<SupervisorIncidentsPage />} />
                  <Route path="analytics" element={<SupervisorAnalyticsPage />} />
                  <Route path="rules" element={<SupervisorRulesPage />} />
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
                  <Route path="reports" element={<ExecutiveReportsPage />} />
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
