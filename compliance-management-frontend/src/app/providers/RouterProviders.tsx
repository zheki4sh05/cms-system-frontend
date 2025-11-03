

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
import { ExecutiveDashboardPage } from '@pages/executive/DashboardPage/DashBoardPage';
import { ExecutiveReportsPage } from '@pages/executive/ReportsPage/ExecutiveReportsPage';

// Other
import { NotFoundPage } from '@pages/NotFoundPage/NotFoundPage';
import { ProtectedRoute } from '@shared/lib/hooks/ProtectedRoute';
import { UserRoleValues } from '@shared/types/customTypes';

export const RouterProvider: FC = observer(() => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Manager routes */}
        <Route
          path="/manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.MANAGER]}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/incidents"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.MANAGER]}>
              <ManagerIncidentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/cases"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.MANAGER]}>
              <ManagerCasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager/tasks"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.MANAGER]}>
              <ManagerTasksPage />
            </ProtectedRoute>
          }
        />

        {/* Supervisor routes */}
        <Route
          path="/supervisor/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.SUPERVISOR]}>
              <SupervisorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/cases"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.SUPERVISOR]}>
              <SupervisorCasesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/incidents"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.SUPERVISOR]}>
              <SupervisorIncidentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/supervisor/analytics"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.SUPERVISOR]}>
              <SupervisorAnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Executive routes */}
        <Route
          path="/executive/dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.EXECUTIVE]}>
              <ExecutiveDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/executive/reports"
          element={
            <ProtectedRoute allowedRoles={[UserRoleValues.EXECUTIVE]}>
              <ExecutiveReportsPage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
});
