// src/pages/manager/TasksPage/TasksPage.tsx

import { type FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Tooltip,
  Avatar,
  ListItemAvatar,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  PlayArrow as StartIcon,
  AttachFile as AttachIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Send as SendIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { TaskApi } from '@shared/lib/api/taskApi';
import { CaseApi } from '@shared/lib/api/caseApi';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  ActionPlan,
  CreateTaskRequest,
  TaskStatistics,
} from '@shared/types/taskTypes';
import type { Case, CaseStatus } from '@shared/types/caseTypes';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ManagerTasksPage: FC = observer(() => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Диалоги
  const [createPlanDialogOpen, setCreatePlanDialogOpen] = useState(false);
  const [viewPlanDialogOpen, setViewPlanDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  
  // Создание плана
  const [selectedCaseForPlan, setSelectedCaseForPlan] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [planTasks, setPlanTasks] = useState<CreateTaskRequest[]>([]);
  
  // Просмотр плана
  const [selectedPlan, setSelectedPlan] = useState<ActionPlan | null>(null);
  
  // Редактирование задачи
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);

  useEffect(() => {
    loadData();
    
    // Проверить, нужно ли открыть диалог создания плана
    const state = location.state as any;
    if (state?.createPlanForCase) {
      handleOpenCreatePlan(state.createPlanForCase);
    }
  }, [location]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, plansData, statsData] = await Promise.all([
        TaskApi.getMyTasks(),
        TaskApi.getActionPlans(),
        TaskApi.getTaskStatistics(),
      ]);
      setTasks(tasksData);
      setActionPlans(plansData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreatePlan = async (caseId: string) => {
    setSelectedCaseForPlan(caseId);
    
    try {
      const caseData = await CaseApi.getCase(caseId);
      setSelectedCase(caseData);
      setPlanTitle(`План корректирующих действий для случая ${caseData.id}`);
      setPlanDescription(caseData.rootCause || '');
      setCreatePlanDialogOpen(true);
    } catch (error) {
      console.error('Failed to load case:', error);
    }
  };

  const handleAddTaskToPlan = () => {
    setPlanTasks([
      ...planTasks,
      {
        title: '',
        description: '',
        priority: 'NORMAL' as TaskPriority,
        assigneeId: '1', // Current user
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // +7 days
      },
    ]);
  };

  const handleUpdatePlanTask = (index: number, field: keyof CreateTaskRequest, value: any) => {
    const updated = [...planTasks];
    updated[index] = { ...updated[index], [field]: value };
    setPlanTasks(updated);
  };

  const handleRemovePlanTask = (index: number) => {
    setPlanTasks(planTasks.filter((_, i) => i !== index));
  };

  const handleCreatePlan = async () => {
    if (!selectedCaseForPlan || planTasks.length === 0) return;
    
    try {
      const plan = await TaskApi.createActionPlan({
        caseId: selectedCaseForPlan,
        title: planTitle,
        description: planDescription,
        tasks: planTasks,
      });

      await CaseApi.updateCase(selectedCaseForPlan, {
        status: 'ACTION_PLAN' as CaseStatus,
      });
      
      await loadData();
      setCreatePlanDialogOpen(false);
      resetPlanForm();
      
      // Показать созданный план
      setSelectedPlan(plan);
      setViewPlanDialogOpen(true);
    } catch (error) {
      console.error('Failed to create action plan:', error);
    }
  };

  const handleSubmitPlanForVerification = async () => {
    if (!selectedPlan) return;
    
    try {
      await TaskApi.submitForVerification(selectedPlan.id);
      await CaseApi.updateCase(selectedPlan.caseId, {
        status: 'PENDING_VERIFICATION' as CaseStatus,
      });
      await loadData();
      setViewPlanDialogOpen(false);
      setSelectedPlan(null);
    } catch (error) {
      console.error('Failed to submit plan:', error);
    }
  };

  const resetPlanForm = () => {
    setSelectedCaseForPlan(null);
    setSelectedCase(null);
    setPlanTitle('');
    setPlanDescription('');
    setPlanTasks([]);
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTask(task);
    setEvidenceDescription(task.evidenceDescription || '');
    setTaskDialogOpen(true);
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;
    
    try {
      // Загрузить файлы доказательств
      for (const file of evidenceFiles) {
        await TaskApi.uploadTaskEvidence(selectedTask.id, file);
      }
      
      // Завершить задачу
      await TaskApi.completeTask(selectedTask.id, evidenceDescription);
      await loadData();
      setTaskDialogOpen(false);
      setSelectedTask(null);
      setEvidenceDescription('');
      setEvidenceFiles([]);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleStartTask = async (taskId: string) => {
    try {
      await TaskApi.updateTask(taskId, { status: 'IN_PROGRESS' as TaskStatus });
      await loadData();
    } catch (error) {
      console.error('Failed to start task:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setEvidenceFiles(Array.from(event.target.files));
    }
  };

  const getTaskPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'info';
      case 'LOW': return 'success';
    }
  };

  const getTaskStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'TODO': return 'default';
      case 'IN_PROGRESS': return 'primary';
      case 'DONE': return 'success';
      case 'BLOCKED': return 'error';
    }
  };

  const getTaskStatusLabel = (status: TaskStatus) => {
    const labels = {
      TODO: 'К выполнению',
      IN_PROGRESS: 'В работе',
      DONE: 'Выполнено',
      BLOCKED: 'Заблокировано',
    };
    return labels[status];
  };

  const getPlanStatusLabel = (status: ActionPlan['status']) => {
    const labels = {
      DRAFT: 'Черновик',
      PENDING_APPROVAL: 'На утверждении',
      APPROVED: 'Утвержден',
      IN_PROGRESS: 'В работе',
      COMPLETED: 'Завершен',
      REJECTED: 'Отклонен',
    };
    return labels[status];
  };

  const getPlanStatusColor = (status: ActionPlan['status']) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'PENDING_APPROVAL': return 'warning';
      case 'APPROVED': return 'info';
      case 'IN_PROGRESS': return 'primary';
      case 'COMPLETED': return 'success';
      case 'REJECTED': return 'error';
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.caseTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todoTasks = filteredTasks.filter(t => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Заголовок */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Мои задачи
          </Typography>
          <Button
            variant="outlined"
            startIcon={<InfoIcon />}
            onClick={() => navigate('/manager/cases')}
          >
            Перейти к случаям
          </Button>
        </Box>

        {/* Статистика */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{xs: 12, sm:6, md:2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{statistics.todo}</Typography>
                  <Typography variant="body2" color="text.secondary">К выполнению</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm:6, md:2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{statistics.inProgress}</Typography>
                  <Typography variant="body2" color="text.secondary">В работе</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm:6, md:2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">{statistics.done}</Typography>
                  <Typography variant="body2" color="text.secondary">Выполнено</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm:6, md:2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error.main">{statistics.overdue}</Typography>
                  <Typography variant="body2" color="text.secondary">Просрочено</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm:6, md:2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">{statistics.dueToday}</Typography>
                  <Typography variant="body2" color="text.secondary">Сегодня</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm:6, md:2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">{statistics.dueTomorrow}</Typography>
                  <Typography variant="body2" color="text.secondary">Завтра</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Табы */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Задачи (${tasks.length})`} />
            <Tab label={`Планы действий (${actionPlans.length})`} />
          </Tabs>

          {/* Вкладка "Задачи" */}
          <TabPanel value={tabValue} index={0}>
            {/* Поиск */}
            <TextField
              fullWidth
              placeholder="Поиск задач..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Канбан-доска */}
            <Grid container spacing={2}>
              {/* К выполнению */}
              <Grid size={{xs: 12, md:4}}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom>
                    К выполнению ({todoTasks.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {todoTasks.map(task => (
                      <Card key={task.id} sx={{ cursor: 'pointer' }} onClick={() => handleOpenTask(task)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.priority}
                              color={getTaskPriorityColor(task.priority)}
                              size="small"
                            />
                          </Box>
                          {task.caseTitle && (
                            <Chip
                              label={task.caseTitle}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 1 }}
                              icon={<AssignmentIcon />}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                          </Typography>
                          {task.isOverdue && (
                            <Chip label="Просрочено" color="error" size="small" sx={{ mt: 1 }} />
                          )}
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<StartIcon />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartTask(task.id);
                            }}
                          >
                            Начать
                          </Button>
                        </CardActions>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* В работе */}
              <Grid size={{xs: 12, md:4}}>
                <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                  <Typography variant="h6" gutterBottom>
                    В работе ({inProgressTasks.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {inProgressTasks.map(task => (
                      <Card key={task.id} sx={{ cursor: 'pointer', borderLeft: 3, borderColor: 'primary.main' }} onClick={() => handleOpenTask(task)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {task.title}
                            </Typography>
                            <Chip
                              label={task.priority}
                              color={getTaskPriorityColor(task.priority)}
                              size="small"
                            />
                          </Box>
                          {task.caseTitle && (
                            <Chip
                              label={task.caseTitle}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 1 }}
                              icon={<AssignmentIcon />}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            Срок: {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                          </Typography>
                          {task.isOverdue && (
                            <Chip label="Просрочено" color="error" size="small" sx={{ mt: 1 }} />
                          )}
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<CheckIcon />}
                            color="success"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTask(task);
                            }}
                          >
                            Завершить
                          </Button>
                        </CardActions>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Выполнено */}
              <Grid size={{xs: 12, md:4}}>
                <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                  <Typography variant="h6" gutterBottom>
                    Выполнено ({doneTasks.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {doneTasks.map(task => (
                      <Card key={task.id} sx={{ cursor: 'pointer', opacity: 0.8 }} onClick={() => handleOpenTask(task)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography variant="body1" fontWeight="medium" sx={{ textDecoration: 'line-through' }}>
                              {task.title}
                            </Typography>
                            <CheckIcon color="success" />
                          </Box>
                          {task.caseTitle && (
                            <Chip
                              label={task.caseTitle}
                              size="small"
                              variant="outlined"
                              sx={{ mb: 1 }}
                              icon={<AssignmentIcon />}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary" display="block">
                            Завершено: {task.completedAt ? new Date(task.completedAt).toLocaleDateString('ru-RU') : '-'}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Вкладка "Планы действий" */}
          <TabPanel value={tabValue} index={1}>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Планы корректирующих действий создаются после завершения расследования случая. 
                Перейдите на вкладку <strong>Случаи</strong>, завершите расследование и выберите 
                "Требуются корректирующие действия".
              </Typography>
            </Alert>

            {actionPlans.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Нет планов действий
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Планы будут созданы после завершения расследования случаев
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/manager/cases')}
                >
                  Перейти к случаям
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {actionPlans.map(plan => (
                  <Accordion key={plan.id}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%', pr: 2 }}>
                        <AssignmentIcon color="primary" />
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {plan.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Случай: {plan.caseTitle}
                          </Typography>
                        </Box>
                        <Chip
                          label={getPlanStatusLabel(plan.status)}
                          color={getPlanStatusColor(plan.status)}
                          size="small"
                        />
                        <Box sx={{ minWidth: 120 }}>
                          <Typography variant="caption" color="text.secondary">
                            Прогресс: {plan.progressPercentage}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={plan.progressPercentage}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        {plan.description}
                      </Typography>
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="subtitle2" gutterBottom>
                        Задачи ({plan.completedTasks}/{plan.totalTasks})
                      </Typography>
                      <List>
                        {plan.tasks.map(task => (
                          <ListItem
                            key={task.id}
                            sx={{
                              border: 1,
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => handleOpenTask(task)}
                          >
                            <ListItemIcon>
                              {task.status === 'DONE' ? (
                                <CheckIcon color="success" />
                              ) : task.isOverdue ? (
                                <ErrorIcon color="error" />
                              ) : (
                                <ScheduleIcon color="action" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={task.title}
                              secondary={
                                <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                                  <Chip
                                    label={getTaskStatusLabel(task.status)}
                                    color={getTaskStatusColor(task.status)}
                                    size="small"
                                  />
                                  <Chip
                                    label={task.priority}
                                    color={getTaskPriorityColor(task.priority)}
                                    size="small"
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    До: {new Date(task.dueDate).toLocaleDateString('ru-RU')}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>

                      {plan.status === 'DRAFT' && (
                        <Button
                          variant="contained"
                          startIcon={<SendIcon />}
                          fullWidth
                          sx={{ mt: 2 }}
                          onClick={() => {
                            setSelectedPlan(plan);
                            setViewPlanDialogOpen(true);
                          }}
                        >
                          Отправить на утверждение
                        </Button>
                      )}

                      {plan.status === 'REJECTED' && plan.rejectionReason && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Причина отклонения:</strong> {plan.rejectionReason}
                          </Typography>
                        </Alert>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </TabPanel>
        </Paper>

        {/* Диалог создания плана */}
        <Dialog
          open={createPlanDialogOpen}
          onClose={() => setCreatePlanDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Создание плана корректирующих действий</Typography>
              <IconButton onClick={() => setCreatePlanDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedCase && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Случай:</strong> {selectedCase.title} ({selectedCase.id})
                </Typography>
              </Alert>
            )}

            <TextField
              fullWidth
              label="Название плана"
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Описание плана"
              multiline
              rows={3}
              value={planDescription}
              onChange={(e) => setPlanDescription(e.target.value)}
              sx={{ mb: 3 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">
                Задачи плана ({planTasks.length})
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddTaskToPlan}
              >
                Добавить задачу
              </Button>
            </Box>

            {planTasks.map((task, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2">Задача #{index + 1}</Typography>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleRemovePlanTask(index)}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <TextField
                  fullWidth
                  label="Название задачи"
                  value={task.title}
                  onChange={(e) => handleUpdatePlanTask(index, 'title', e.target.value)}
                  sx={{ mb: 2 }}
                  required
                />

                <TextField
                  fullWidth
                  label="Описание"
                  multiline
                  rows={2}
                  value={task.description}
                  onChange={(e) => handleUpdatePlanTask(index, 'description', e.target.value)}
                  sx={{ mb: 2 }}
                />

                <Grid container spacing={2}>
                  <Grid size={{xs: 6}}>
                    <FormControl fullWidth>
                      <InputLabel>Приоритет</InputLabel>
                      <Select
                        value={task.priority}
                        label="Приоритет"
                        onChange={(e) => handleUpdatePlanTask(index, 'priority', e.target.value)}
                      >
                        <MenuItem value="LOW">Низкий</MenuItem>
                        <MenuItem value="NORMAL">Нормальный</MenuItem>
                        <MenuItem value="HIGH">Высокий</MenuItem>
                        <MenuItem value="URGENT">Срочный</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{xs: 6}}>
                    <TextField
                      fullWidth
                      label="Срок выполнения"
                      type="date"
                      value={task.dueDate.split('T')[0]}
                      onChange={(e) => handleUpdatePlanTask(index, 'dueDate', new Date(e.target.value).toISOString())}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}

            {planTasks.length === 0 && (
              <Alert severity="warning">
                Добавьте хотя бы одну задачу в план
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreatePlanDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleCreatePlan}
              disabled={!planTitle || planTasks.length === 0 || planTasks.some(t => !t.title)}
            >
              Создать план
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог просмотра плана */}
        <Dialog
          open={viewPlanDialogOpen}
          onClose={() => setViewPlanDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedPlan && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedPlan.title}</Typography>
                  <Chip
                    label={getPlanStatusLabel(selectedPlan.status)}
                    color={getPlanStatusColor(selectedPlan.status)}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" paragraph>
                  {selectedPlan.description}
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Случай:</strong> {selectedPlan.caseTitle}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Прогресс:</strong> {selectedPlan.completedTasks} из {selectedPlan.totalTasks} задач выполнено ({selectedPlan.progressPercentage}%)
                  </Typography>
                </Alert>

                <LinearProgress
                  variant="determinate"
                  value={selectedPlan.progressPercentage}
                  sx={{ mb: 3, height: 8, borderRadius: 1 }}
                />

                <Typography variant="subtitle1" gutterBottom>
                  Задачи плана
                </Typography>
                <List>
                  {selectedPlan.tasks.map(task => (
                    <ListItem key={task.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                      <ListItemIcon>
                        {task.status === 'DONE' ? <CheckIcon color="success" /> : <ScheduleIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={getTaskStatusLabel(task.status)} size="small" color={getTaskStatusColor(task.status)} />
                            <Chip label={task.priority} size="small" color={getTaskPriorityColor(task.priority)} />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setViewPlanDialogOpen(false)}>
                  Закрыть
                </Button>
                {selectedPlan.status === 'DRAFT' && (
                  <Button
                    variant="contained"
                    startIcon={<SendIcon />}
                    onClick={handleSubmitPlanForVerification}
                  >
                    Отправить на утверждение
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог задачи */}
        <Dialog
          open={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedTask && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedTask.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={selectedTask.priority}
                      color={getTaskPriorityColor(selectedTask.priority)}
                      size="small"
                    />
                    <Chip
                      label={getTaskStatusLabel(selectedTask.status)}
                      color={getTaskStatusColor(selectedTask.status)}
                      size="small"
                    />
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" paragraph>
                  {selectedTask.description}
                </Typography>

                {selectedTask.caseTitle && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Связанный случай:</strong> {selectedTask.caseTitle}
                    </Typography>
                  </Alert>
                )}

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{xs: 6}}>
                    <Typography variant="caption" color="text.secondary">Исполнитель</Typography>
                    <Typography variant="body2">{selectedTask.assigneeName}</Typography>
                  </Grid>
                  <Grid size={{xs: 6}}>
                    <Typography variant="caption" color="text.secondary">Срок выполнения</Typography>
                    <Typography variant="body2">
                      {new Date(selectedTask.dueDate).toLocaleDateString('ru-RU')}
                      {selectedTask.isOverdue && (
                        <Chip label="Просрочено" color="error" size="small" sx={{ ml: 1 }} />
                      )}
                    </Typography>
                  </Grid>
                </Grid>

                {selectedTask.status === 'IN_PROGRESS' && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Завершение задачи
                    </Typography>
                    <TextField
                      fullWidth
                      label="Описание выполненной работы"
                      multiline
                      rows={4}
                      value={evidenceDescription}
                      onChange={(e) => setEvidenceDescription(e.target.value)}
                      placeholder="Опишите, что было сделано для выполнения задачи..."
                      sx={{ mb: 2 }}
                    />

                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachIcon />}
                      fullWidth
                    >
                      Прикрепить доказательства ({evidenceFiles.length})
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={handleFileChange}
                      />
                    </Button>

                    {evidenceFiles.length > 0 && (
                      <List dense sx={{ mt: 1 }}>
                        {evidenceFiles.map((file, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              <AttachIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={file.name}
                              secondary={`${(file.size / 1024).toFixed(2)} KB`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </>
                )}

                {selectedTask.status === 'DONE' && selectedTask.evidenceDescription && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Доказательства выполнения
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                      <Typography variant="body2">
                        {selectedTask.evidenceDescription}
                      </Typography>
                      {selectedTask.evidenceAttachments && selectedTask.evidenceAttachments.length > 0 && (
                        <List dense>
                          {selectedTask.evidenceAttachments.map((att) => (
                            <ListItem key={att.id}>
                              <ListItemIcon>
                                <AttachIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={att.fileName} />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Paper>
                  </>
                )}
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setTaskDialogOpen(false)}>
                  Закрыть
                </Button>
                {selectedTask.status === 'TODO' && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleStartTask(selectedTask.id);
                      setTaskDialogOpen(false);
                    }}
                    startIcon={<StartIcon />}
                  >
                    Начать работу
                  </Button>
                )}
                {selectedTask.status === 'IN_PROGRESS' && (
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleCompleteTask}
                    disabled={!evidenceDescription.trim()}
                    startIcon={<CheckIcon />}
                  >
                    Завершить задачу
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
});
