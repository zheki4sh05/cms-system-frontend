
import { useState, type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useLocation } from 'react-router-dom';
import {
 Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Typography,
  Badge,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess,
  ExpandMore,
  SettingsOutlined,
  PeopleOutlined,
  DescriptionOutlined,
  BusinessOutlined,
  ApartmentOutlined,
  AdminPanelSettingsOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '@features/auth/useAuthStore';
import { getNavigationByRole } from './../Layout/navigationConfig';
import { EmployeesDrawer } from '@widgets/Layout/EmployeesDrawer';
import { DocumentsDrawer } from '@widgets/Layout/DocumentsDrawer';
import { DepartmentsDrawer } from '@widgets/Layout/DepartmentDrawer';
import { CompanyDrawer } from '@widgets/Layout/CompanyDrawer';

interface SidebarProps {
  open: boolean;
  onToggle: () => void;
  drawerWidth: number;
  drawerWidthClosed: number;
}

export const Sidebar: FC<SidebarProps> = observer(({ 
  open, 
  onToggle, 
  drawerWidth, 
  drawerWidthClosed 
}) => {
  const authStore = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = getNavigationByRole(authStore.userRole);
  const adminPanelUrl = (import.meta.env.VITE_ADMIN_PANEL_URL ?? '').trim();
  const showAdminPanelLink =
    Boolean(authStore.user?.hasAdminAccess) && adminPanelUrl.length > 0;

  // Состояние раскрытия секции "Дополнительно"
  const [additionalOpen, setAdditionalOpen] = useState(false);

  // Состояния для Drawer'ов
  const [employeesDrawerOpen, setEmployeesDrawerOpen] = useState(false);
  const [documentsDrawerOpen, setDocumentsDrawerOpen] = useState(false);
  const [departmentsDrawerOpen, setDepartmentsDrawerOpen] = useState(false);
  const [companyDrawerOpen, setCompanyDrawerOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleToggleAdditional = () => {
    setAdditionalOpen(!additionalOpen);
  };

  return (
    <>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : drawerWidthClosed,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : drawerWidthClosed,
            boxSizing: 'border-box',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {/* Logo and Title */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: open ? 'space-between' : 'center',
            p: 2,
            minHeight: 64,
          }}
        >
          {open && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1,
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                }}
              >
                T
              </Box>
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                TrustFlow
              </Typography>
            </Box>
          )}

          <IconButton onClick={onToggle} size="small">
            {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </Box>

        <Divider />

        {/* Navigation Items */}
        <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <Tooltip 
                key={item.id} 
                title={!open ? item.label : ''} 
                placement="right"
              >
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.badge ? (
                      <Badge badgeContent={item.badge} color="error">
                        <Icon />
                      </Badge>
                    ) : (
                      <Icon />
                    )}
                  </ListItemIcon>

                  {open && (
                    <ListItemText 
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    />
                  )}
                </ListItemButton>
              </Tooltip>
            );
          })}

          {showAdminPanelLink && (
            <Tooltip
              title={!open ? 'Перейти в админ-панель' : ''}
              placement="right"
            >
              <ListItemButton
                component="a"
                href={adminPanelUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <AdminPanelSettingsOutlined />
                </ListItemIcon>
                {open && (
                  <ListItemText
                    primary="Перейти в админ-панель"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 400,
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          )}
        </List>

        <Divider />

        {/* Дополнительный функционал - раскрывающаяся секция */}
        <List sx={{ px: 1, py: 1 }}>
          <Tooltip title={!open ? 'Дополнительно' : ''} placement="right">
            <ListItemButton 
              onClick={handleToggleAdditional}
              sx={{ borderRadius: 1 }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsOutlined />
              </ListItemIcon>
              {open && (
                <>
                  <ListItemText 
                    primary="Дополнительно"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                  />
                  {additionalOpen ? <ExpandLess /> : <ExpandMore />}
                </>
              )}
            </ListItemButton>
          </Tooltip>

          {/* Раскрывающийся список */}
          {open && (
            <Collapse in={additionalOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {/* Департаменты */}
                <ListItemButton
                  onClick={() => setDepartmentsDrawerOpen(true)}
                  sx={{
                    pl: 4,
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <BusinessOutlined />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Департаменты"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItemButton>

                {/* Сотрудники */}
                <ListItemButton
                  onClick={() => setEmployeesDrawerOpen(true)}
                  sx={{
                    pl: 4,
                    borderRadius: 1,
                    mb: 0.5,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <PeopleOutlined />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Сотрудники"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItemButton>

                {/* Документы */}
                <ListItemButton
                  onClick={() => setDocumentsDrawerOpen(true)}
                  sx={{
                    pl: 4,
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DescriptionOutlined />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Документы"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItemButton>

                {/* Компания */}
                <ListItemButton
                  onClick={() => setCompanyDrawerOpen(true)}
                  sx={{
                    pl: 4,
                    borderRadius: 1,
                    mt: 0.5,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ApartmentOutlined />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Компания"
                    primaryTypographyProps={{
                      fontSize: '0.875rem',
                    }}
                  />
                </ListItemButton>
              </List>
            </Collapse>
          )}
        </List>
      </Drawer>

      {/* Drawer для департаментов */}
      <DepartmentsDrawer
        open={departmentsDrawerOpen}
        onClose={() => setDepartmentsDrawerOpen(false)}
      />

      {/* Drawer для сотрудников */}
      <EmployeesDrawer
        open={employeesDrawerOpen}
        onClose={() => setEmployeesDrawerOpen(false)}
      />

      {/* Drawer для документов */}
      <DocumentsDrawer
        open={documentsDrawerOpen}
        onClose={() => setDocumentsDrawerOpen(false)}
      />

      {/* Drawer для компании */}
      <CompanyDrawer
        open={companyDrawerOpen}
        onClose={() => setCompanyDrawerOpen(false)}
      />
    </>
  );
});