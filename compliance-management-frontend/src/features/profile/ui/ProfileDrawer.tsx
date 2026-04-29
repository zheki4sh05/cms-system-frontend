import {type FC } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Paper,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  EmailOutlined,
  BadgeOutlined,
  BusinessOutlined,
  CalendarTodayOutlined,
  EditOutlined,
  LogoutOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '@features/auth/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface ProfileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const ProfileDrawer: FC<ProfileDrawerProps> = observer(({ open, onClose }) => {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authStore.logout();
    navigate('/login');
    onClose();
  };

  // Получение названия роли на русском
  const getRoleLabel = () => {
    switch (authStore.userRole) {
      case 'MANAGER':
        return 'Менеджер';
      case 'SUPERVISOR':
        return 'Руководитель';
      case 'EXECUTIVE':
        return 'ТОП-менеджмент';
      default:
        return '';
    }
  };

  // Получение цвета роли
  const getRoleColor = () => {
    switch (authStore.userRole) {
      case 'MANAGER':
        return 'primary';
      case 'SUPERVISOR':
        return 'secondary';
      case 'EXECUTIVE':
        return 'error';
      default:
        return 'default';
    }
  };

  // Получение инициалов
  const getInitials = () => {
    const firstName = authStore.user?.firstName || '';
    const lastName = authStore.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '80%',
          maxWidth: 800,
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              bgcolor: 'white',
              color: 'primary.main',
              fontSize: '2rem',
              fontWeight: 700,
            }}
          >
            {getInitials()}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {authStore.fullName}
            </Typography>
            <Chip
              label={getRoleLabel()}
              color={getRoleColor()}
              size="small"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontWeight: 600,
              }}
            />
          </Box>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Информация о профиле */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Информация о профиле
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <List disablePadding>
            <ListItem disablePadding sx={{ mb: 2 }}>
              <ListItemIcon>
                <EmailOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Email"
                secondary={authStore.user?.email}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>

            <ListItem disablePadding sx={{ mb: 2 }}>
              <ListItemIcon>
                <BadgeOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="ID пользователя"
                secondary={authStore.user?.id}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>

            {authStore.user?.departmentId && (
              <ListItem disablePadding sx={{ mb: 2 }}>
                <ListItemIcon>
                  <BusinessOutlined color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Отдел"
                  secondary={authStore.user.departmentId}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
                />
              </ListItem>
            )}

            <ListItem disablePadding>
              <ListItemIcon>
                <CalendarTodayOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Дата регистрации"
                secondary={new Date().toLocaleDateString('ru-RU')}
                primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                secondaryTypographyProps={{ variant: 'body1', color: 'text.primary' }}
              />
            </ListItem>
          </List>
        </Paper>

        {/* Статистика */}
        <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Статистика активности
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Задач выполнено
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Инцидентов обработано
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                0
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Дней в системе
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Действия */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<EditOutlined />}
            fullWidth
            size="large"
          >
            Редактировать профиль
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<LogoutOutlined />}
            fullWidth
            size="large"
            onClick={handleLogout}
          >
            Выйти из системы
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
});