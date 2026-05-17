// src/widgets/NotificationPanel/NotificationPanel.tsx

import { type FC, useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import {
  Badge,
  IconButton,
  Popover,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Button,
  Tab,
  Tabs,
  Chip,
  Menu,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as UnreadIcon,
  Delete as DeleteIcon,
  MoreVert as MoreIcon,
  DoneAll as MarkAllReadIcon,
  Settings as SettingsIcon,
  FilterList as FilterIcon,
  Close as CloseIcon,
  Assignment as TaskIcon,
  Warning as IncidentIcon,
  Folder as CaseIcon,
  Rule as RuleIcon,
  Info as InfoIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { notificationStore } from '@shared/stores/notificationStore';
import { getWorkflowPriorityLabelRu } from '@shared/lib/domainLabelsRu';
import type { Notification, NotificationCategory } from '@shared/types/notificationTypes';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const NotificationPanel: FC = observer(() => {
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Пометить как прочитанное
    if (!notification.isRead) {
      await notificationStore.markAsRead(notification.id);
    }

    // Перейти по ссылке, если есть
    if (notification.link) {
      navigate(notification.link);
      handleClose();
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationStore.markAllAsRead();
  };

  const handleDeleteAllRead = async () => {
    await notificationStore.deleteAllRead();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notification: Notification) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = async () => {
    if (selectedNotification) {
      await notificationStore.markAsRead(selectedNotification.id);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (selectedNotification) {
      await notificationStore.deleteNotification(selectedNotification.id);
    }
    handleMenuClose();
  };

  const getNotificationIcon = (notification: Notification) => {
    switch (notification.category) {
      case 'TASK':
        return <TaskIcon />;
      case 'INCIDENT':
        return <IncidentIcon />;
      case 'CASE':
        return <CaseIcon />;
      case 'SYSTEM':
        return <InfoIcon />;
      case 'APPROVAL':
        return <RuleIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getNotificationColor = (notification: Notification) => {
    if (notification.priority === 'URGENT') return 'error.main';
    if (notification.priority === 'HIGH') return 'warning.main';
    return 'primary.main';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'default';
      default: return 'default';
    }
  };

  const getRelativeTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ru });
  };

  const filterNotifications = (category?: NotificationCategory) => {
    let filtered = notificationStore.notifications;

    // Фильтр по табам
    if (tabValue === 1) {
      // Только непрочитанные
      filtered = filtered.filter(n => !n.isRead);
    }

    // Фильтр по категории (если реализован)
    if (category) {
      filtered = filtered.filter(n => n.category === category);
    }

    return filtered;
  };

  const notifications = filterNotifications();
  const unreadCount = notificationStore.unreadCount;

  return (
    <>
      <Tooltip title="Уведомления">
        <IconButton color="inherit" onClick={handleOpen}>
          <Badge badgeContent={unreadCount} color="error" max={99}>
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 420,
            maxHeight: 600,
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Заголовок */}
        <Box sx={{ p: 2, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">
            Уведомления
            {unreadCount > 0 && (
              <Chip
                label={unreadCount}
                size="small"
                color="error"
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
          <Box>
            <Tooltip title="Пометить все как прочитанные">
              <IconButton size="small" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                <MarkAllReadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Удалить прочитанные">
              <IconButton size="small" onClick={handleDeleteAllRead}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Закрыть">
              <IconButton size="small" onClick={handleClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Табы */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
          >
            <Tab label={`Все (${notificationStore.stats?.total || 0})`} />
            <Tab label={`Непрочитанные (${unreadCount})`} />
          </Tabs>
        </Box>

        {/* Индикатор подключения WebSocket */}
        {!notificationStore.isConnected && (
          <Alert severity="warning" sx={{ m: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption">
                Переподключение к серверу...
              </Typography>
            </Box>
          </Alert>
        )}

        {/* Список уведомлений */}
        <TabPanel value={tabValue} index={0}>
          <List sx={{ width: '100%', maxHeight: 450, overflow: 'auto', p: 0 }}>
            {notificationStore.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Нет уведомлений
                </Typography>
              </Box>
            ) : (
              notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.isRead ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: notification.isRead ? 'action.hover' : 'action.selected',
                      },
                      position: 'relative',
                      pl: 1,
                    }}
                  >
                    {!notification.isRead && (
                      <Box
                        sx={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 4,
                          bgcolor: getNotificationColor(notification),
                        }}
                      />
                    )}
                    
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getNotificationColor(notification),
                        }}
                      >
                        {getNotificationIcon(notification)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            fontWeight={notification.isRead ? 'normal' : 'bold'}
                            sx={{ flex: 1 }}
                          >
                            {notification.title}
                          </Typography>
                          {notification.priority !== 'LOW' && (
                            <Chip
                              label={getWorkflowPriorityLabelRu(notification.priority)}
                              size="small"
                              color={getPriorityColor(notification.priority)}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              mb: 0.5,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {getRelativeTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleMenuOpen(e, notification)}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List sx={{ width: '100%', maxHeight: 450, overflow: 'auto', p: 0 }}>
            {notificationStore.loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : notificationStore.unreadNotifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4 }}>
                <SuccessIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  Все уведомления прочитаны
                </Typography>
              </Box>
            ) : (
              notificationStore.unreadNotifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                      position: 'relative',
                      pl: 1,
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 4,
                        bgcolor: getNotificationColor(notification),
                      }}
                    />
                    
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getNotificationColor(notification),
                        }}
                      >
                        {getNotificationIcon(notification)}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            fontWeight="bold"
                            sx={{ flex: 1 }}
                          >
                            {notification.title}
                          </Typography>
                          {notification.priority !== 'LOW' && (
                            <Chip
                              label={getWorkflowPriorityLabelRu(notification.priority)}
                              size="small"
                              color={getPriorityColor(notification.priority)}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              mb: 0.5,
                            }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {getRelativeTime(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />

                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleMenuOpen(e, notification)}
                      >
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notificationStore.unreadNotifications.length - 1 && <Divider />}
                </Box>
              ))
            )}
          </List>
        </TabPanel>

        {/* Футер */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  navigate('/notifications');
                  handleClose();
                }}
              >
                Показать все уведомления
              </Button>
            </Box>
          </>
        )}
      </Popover>

      {/* Меню действий для уведомления */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {selectedNotification && !selectedNotification.isRead && (
          <MenuItem onClick={handleMarkAsRead}>
            <MarkAllReadIcon fontSize="small" sx={{ mr: 1 }} />
            Пометить как прочитанное
          </MenuItem>
        )}
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Удалить
        </MenuItem>
      </Menu>
    </>
  );
});
