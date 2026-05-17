// src/pages/manager/DashboardPage/DashboardPage.tsx

import { type FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  WarningAmber as WarningIcon,
  FolderOpen as CaseIcon,
  CheckCircleOutline as TaskIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
  Notifications as NotificationIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DashboardApi } from '@shared/lib/api/dashboardApi';
import type { DashboardStats, RecentActivity, UpcomingTask } from '@shared/types/dashBoardTypes';
import { getSeverityLabelRu, getWorkflowPriorityLabelRu } from '@shared/lib/domainLabelsRu';

export const ManagerDashboardPage: FC = observer(() => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<UpcomingTask[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, activitiesData, tasksData] = await Promise.all([
        DashboardApi.getManagerStats(),
        DashboardApi.getRecentActivities(),
        DashboardApi.getUpcomingTasks(),
      ]);

      setStats(statsData);
      setRecentActivities(activitiesData);
      setUpcomingTasks(tasksData);
    } catch (err) {
      setError('Не удалось загрузить данные панели');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error" action={
            <Button color="inherit" size="small" onClick={loadDashboardData}>
              Повторить
            </Button>
          }>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!stats) return null;

  const getIncidentSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'info';
      default: return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Заголовок */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Панель менеджера по закупкам
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Добро пожаловать! Вот обзор вашей работы на сегодня
          </Typography>
        </Box>

        {/* Карточки статистики */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Новые инциденты */}
          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: 4 
                }
              }}
              onClick={() => navigate('/manager/incidents')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <WarningIcon color="warning" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.newIncidents}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Новые инциденты
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {stats.incidentsTrend > 0 ? (
                      <TrendingUpIcon color="error" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="success" fontSize="small" />
                    )}
                    <Typography variant="caption" sx={{ ml: 0.5 }}>
                      {Math.abs(stats.incidentsTrend)}% за неделю
                    </Typography>
                  </Box>
                  <Chip label={`${stats.urgentIncidents} срочных`} size="small" color="error" />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Активные случаи */}
          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: 4 
                }
              }}
              onClick={() => navigate('/manager/cases')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CaseIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.activeCases}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Активные случаи
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={(stats.closedCases / (stats.activeCases + stats.closedCases)) * 100}
                    sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 1 }}
                  />
                  <Typography variant="caption">
                    {stats.closedCases} закрыто
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Мои задачи */}
          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s',
                '&:hover': { 
                  transform: 'translateY(-4px)', 
                  boxShadow: 4 
                }
              }}
              onClick={() => navigate('/manager/tasks')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TaskIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.myTasks}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Мои задачи
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">
                    Выполнено: {stats.completedTasks}
                  </Typography>
                  <Chip 
                    label={`${stats.overdueTasks} просрочено`} 
                    size="small" 
                    color={stats.overdueTasks > 0 ? 'error' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Производительность */}
          <Grid size={{xs: 12, sm: 6, md: 3}}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <TrendingUpIcon color="info" sx={{ fontSize: 40, mr: 2 }} />
                  <Box>
                    <Typography variant="h4" fontWeight="bold">
                      {stats.performanceScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Производительность
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={stats.performanceScore}
                  color={stats.performanceScore >= 80 ? 'success' : stats.performanceScore >= 60 ? 'warning' : 'error'}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Среднее время обработки: {stats.avgProcessingTime}ч
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Последние активности */}
          <Grid  size={{xs: 12, md: 8}}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Последние активности
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />}>
                  Посмотреть все
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              {recentActivities.length === 0 ? (
                <Alert severity="info">Нет недавних активностей</Alert>
              ) : (
                <List>
                  {recentActivities.map((activity, index) => (
                    <Box key={activity.id}>
                      <ListItem 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                        }}
                        onClick={() => {
                          if (activity.type === 'INCIDENT') navigate('/manager/incidents');
                          if (activity.type === 'CASE') navigate('/manager/cases');
                          if (activity.type === 'TASK') navigate('/manager/tasks');
                        }}
                      >
                        <ListItemIcon>
                          {activity.type === 'INCIDENT' && <WarningIcon color="warning" />}
                          {activity.type === 'CASE' && <CaseIcon color="primary" />}
                          {activity.type === 'TASK' && <TaskIcon color="success" />}
                          {activity.type === 'NOTIFICATION' && <NotificationIcon color="info" />}
                        </ListItemIcon>
                        <ListItemText
                          primary={activity.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {activity.timestamp}
                              </Typography>
                              {activity.severity && (
                                <Chip 
                                  label={getSeverityLabelRu(activity.severity)} 
                                  size="small" 
                                  color={getIncidentSeverityColor(activity.severity)}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentActivities.length - 1 && <Divider variant="inset" component="li" />}
                    </Box>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Предстоящие задачи */}
          <Grid  size={{xs: 12, md: 4}}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Предстоящие задачи
                </Typography>
                <IconButton size="small" onClick={() => navigate('/manager/tasks')}>
                  <ArrowForwardIcon />
                </IconButton>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {upcomingTasks.length === 0 ? (
                <Alert severity="success">Все задачи выполнены!</Alert>
              ) : (
                <List>
                  {upcomingTasks.map((task, index) => (
                    <Box key={task.id}>
                      <ListItem 
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'action.hover' },
                          borderRadius: 1,
                          px: 1,
                        }}
                        onClick={() => navigate('/manager/tasks')}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {task.isOverdue ? (
                            <ErrorIcon color="error" />
                          ) : task.dueIn === 'Сегодня' ? (
                            <WarningIcon color="warning" />
                          ) : (
                            <ScheduleIcon color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight="medium">
                              {task.title}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography 
                                variant="caption" 
                                color={task.isOverdue ? 'error.main' : 'text.secondary'}
                              >
                                {task.dueIn}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                <Chip 
                                  label={getWorkflowPriorityLabelRu(task.priority)} 
                                  size="small" 
                                  color={getTaskPriorityColor(task.priority)}
                                  sx={{ height: 20, fontSize: '0.7rem' }}
                                />
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < upcomingTasks.length - 1 && <Divider variant="inset" component="li" />}
                    </Box>
                  ))}
                </List>
              )}

              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/manager/tasks')}
              >
                Посмотреть все задачи
              </Button>
            </Paper>
          </Grid>
        </Grid>

        {/* Быстрые действия */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Быстрые действия
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{xs: 12, sm: 6, md: 3}}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<WarningIcon />}
                onClick={() => navigate('/manager/incidents')}
              >
                Создать инцидент
              </Button>
            </Grid>
            <Grid  size={{xs: 12, sm: 6, md: 3}}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<CaseIcon />}
                onClick={() => navigate('/manager/cases')}
              >
                Открыть случай
              </Button>
            </Grid>
            <Grid  size={{xs: 12, sm: 6, md: 3}}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<TaskIcon />}
                onClick={() => navigate('/manager/tasks')}
              >
                Добавить задачу
              </Button>
            </Grid>
            <Grid  size={{xs: 12, sm: 6, md: 3}}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<InfoIcon />}
                onClick={() => navigate('/manager/help')}
              >
                Получить помощь
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
});
