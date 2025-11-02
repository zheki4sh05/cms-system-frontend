
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@pages/auth/LoginPage/LoginPage';
import type { FC } from 'react';
import { ManagerDashboardPage } from '@pages/manager/DashboardPage/DashBoardPage';
import { ExecutiveDashboardPage } from '@pages/executive/DashboardPage/DashBoardPage';
import { SupervisorDashboardPage } from '@pages/supervisor/DashboardPage/DashBoardPage';
import { NotFoundPage } from '@pages/NotFoundPage/NotFoundPage';


export const RouterProvider: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Manager routes */}
        <Route path="/manager/dashboard" element={<ManagerDashboardPage />} />
        
        {/* Supervisor routes */}
        <Route path="/supervisor/dashboard" element={<SupervisorDashboardPage />} />
        
        {/* Executive routes */}
        <Route path="/executive/dashboard" element={<ExecutiveDashboardPage />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
