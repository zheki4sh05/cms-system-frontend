import { type FC, type ReactNode, useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './../Sidebar/Sidebar';
import { Header } from './../Header/Header';
import { useAuthStore } from '@features/auth/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_CLOSED = 72;

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
const authStore = useAuthStore();
const navigate = useNavigate();
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

   useEffect(() => {
    // Если это первый вход (регистрация), редиректим на Help
    if (authStore.isFirstLogin && !location.pathname.includes('/help')) {
      const helpPath = getHelpPathByRole(authStore.userRole);
      if (helpPath) {
        navigate(helpPath, { replace: true });
        // Отмечаем, что пользователь уже видел страницу помощи
        authStore.markAsReturningUser();
      }
    }
  }, [authStore.isFirstLogin, authStore.userRole, location.pathname, navigate]);

   // Получить путь к странице помощи по роли
  const getHelpPathByRole = (role: string | null): string | null => {
    switch (role) {
      case 'MANAGER':
        return '/manager/help';
      case 'SUPERVISOR':
        return '/supervisor/help';
      case 'EXECUTIVE':
        return '/executive/help';
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sidebar 
        open={sidebarOpen} 
        onToggle={handleToggleSidebar}
        drawerWidth={DRAWER_WIDTH}
        drawerWidthClosed={DRAWER_WIDTH_CLOSED}
      />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: theme => theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          marginLeft: `10px`,
          width: `calc(100% - ${sidebarOpen ? DRAWER_WIDTH : DRAWER_WIDTH_CLOSED}px)`,
        }}
      >
        {/* Header */}
        <Header />

        {/* Page content */}
        <Box
          sx={{
            flexGrow: 1,
            p: 3,
            backgroundColor: 'background.default',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};