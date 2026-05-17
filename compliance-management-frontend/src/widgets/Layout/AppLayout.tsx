import { type FC, type ReactNode, useState } from 'react';
import { Box } from '@mui/material';
import { Sidebar } from './../Sidebar/Sidebar';
import { Header } from './../Header/Header';

interface AppLayoutProps {
  children: ReactNode;
}

const DRAWER_WIDTH = 260;
const DRAWER_WIDTH_CLOSED = 72;

export const AppLayout: FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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