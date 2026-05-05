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
  LinearProgress,
  Tooltip,
  Stack,
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
  Visibility as ViewIcon,
  Send as SendIcon,
  Comment as CommentIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteOutlineIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { TaskApi } from '@shared/lib/api/taskApi';
import { getCaseStatusLabelRu, getIncidentStatusLabelRu } from '@shared/lib/statusLabels';
import { CaseApi } from '@shared/lib/api/caseApi';
import { IncidentApi } from '@shared/lib/api/incidentApi';
import {
  ActionPlanDetailsSection,
  ActionPlanRiskObjectCaption,
} from '@shared/lib/actionPlanView';
import { getFileKindShortLabel } from '@shared/lib/fileDisplay';
import type {
  Task,
  TaskStatus,
  TaskPriority,
  ActionPlan,
  CreateTaskRequest,
  TaskStatistics,
} from '@shared/types/taskTypes';
import type { Case, CaseAttachment, CaseComment, CaseViewItem } from '@shared/types/caseTypes';
import type { Incident, IncidentViewDto } from '@shared/types/incidentTypes';

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
  const [editPlanDialogOpen, setEditPlanDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDetailsDialogOpen, setTaskDetailsDialogOpen] = useState(false);
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailActionError, setDetailActionError] = useState<string | null>(null);
  const [casePreviewOpen, setCasePreviewOpen] = useState(false);
  const [casePreviewTab, setCasePreviewTab] = useState(0);
  const [casePreviewView, setCasePreviewView] = useState<CaseViewItem | null>(null);
  const [casePreviewLoading, setCasePreviewLoading] = useState(false);
  const [caseComments, setCaseComments] = useState<CaseComment[]>([]);
  const [caseCommentsLoading, setCaseCommentsLoading] = useState(false);
  const [caseAttachments, setCaseAttachments] = useState<CaseAttachment[]>([]);
  const [caseAttachmentsLoading, setCaseAttachmentsLoading] = useState(false);
  const [newCaseComment, setNewCaseComment] = useState('');
  const [caseAttachmentDownloadId, setCaseAttachmentDownloadId] = useState<string | null>(null);
  const [caseAttachmentDeleteId, setCaseAttachmentDeleteId] = useState<string | null>(null);
  const [incidentPreviewOpen, setIncidentPreviewOpen] = useState(false);
  const [incidentViewData, setIncidentViewData] = useState<IncidentViewDto | null>(null);
  const [incidentPreviewLoading, setIncidentPreviewLoading] = useState(false);

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editPlanTitle, setEditPlanTitle] = useState('');
  const [editPlanDescription, setEditPlanDescription] = useState('');
  const [editPlanComment, setEditPlanComment] = useState('');
  const [editPlanSaving, setEditPlanSaving] = useState(false);

  const [viewNewTaskTitle, setViewNewTaskTitle] = useState('');
  const [viewNewTaskDescription, setViewNewTaskDescription] = useState('');
  const [viewNewTaskPriority, setViewNewTaskPriority] = useState<TaskPriority>('NORMAL');
  const [viewNewTaskDueDate, setViewNewTaskDueDate] = useState(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  );
  const [viewAddTaskSaving, setViewAddTaskSaving] = useState(false);
  
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
    void loadData();

    const state = location.state as { createPlanForCase?: string; tasksTab?: string } | null | undefined;
    if (state?.tasksTab === 'action-plans') {
      setTabValue(1);
    }
    if (state?.createPlanForCase) {
      void handleOpenCreatePlan(state.createPlanForCase);
    }
    if (state?.tasksTab === 'action-plans' || state?.createPlanForCase) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksResult, plansResult, statsResult] = await Promise.allSettled([
        TaskApi.getMyTasks(),
        TaskApi.getActionPlans(),
        TaskApi.getTaskStatistics(),
      ]);

      if (tasksResult.status === 'fulfilled') {
        setTasks(tasksResult.value);
      } else {
        console.error('Failed to load tasks:', tasksResult.reason);
        setTasks([]);
      }

      if (plansResult.status === 'fulfilled') {
        setActionPlans(plansResult.value);
      } else {
        console.error('Failed to load action plans:', plansResult.reason);
        setActionPlans([]);
      }

      if (statsResult.status === 'fulfilled') {
        setStatistics(statsResult.value);
      } else {
        console.error('Failed to load task statistics:', statsResult.reason);
        setStatistics(null);
      }
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
    if (!selectedCaseForPlan) return;

    try {
      const plan = await TaskApi.createActionPlan({
        caseId: selectedCaseForPlan,
        title: planTitle,
        description: planDescription,
        tasks: planTasks,
      });

      await loadData();
      setCreatePlanDialogOpen(false);
      resetPlanForm();

      setSelectedPlan(plan);
      setViewPlanDialogOpen(true);
    } catch (error) {
      console.error('Failed to create action plan:', error);
    }
  };

  const handleDeleteActionPlan = async (planId: string) => {
    if (!window.confirm('Удалить этот план действий?')) return;

    try {
      await TaskApi.deleteActionPlan(planId);
      await loadData();
      if (selectedPlan?.id === planId) {
        setViewPlanDialogOpen(false);
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('Failed to delete action plan:', error);
    }
  };

  const resetViewNewTaskForm = () => {
    setViewNewTaskTitle('');
    setViewNewTaskDescription('');
    setViewNewTaskPriority('NORMAL');
    setViewNewTaskDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
  };

  const handleOpenPlanDetails = (plan: ActionPlan) => {
    setSelectedPlan(plan);
    resetViewNewTaskForm();
    setViewPlanDialogOpen(true);
  };

  const handleAppendTaskToPlan = async () => {
    if (!selectedPlan || !viewNewTaskTitle.trim() || viewAddTaskSaving) return;

    const nextTask = {
      title: viewNewTaskTitle.trim(),
      description: viewNewTaskDescription.trim(),
      priority: viewNewTaskPriority,
      dueDate: viewNewTaskDueDate,
    };

    const tasksPayload = [...TaskApi.tasksForActionPlanPost(selectedPlan.tasks), nextTask];

    setViewAddTaskSaving(true);
    try {
      const updated = await TaskApi.postActionPlan({
        caseId: selectedPlan.caseId,
        title: selectedPlan.title,
        description: selectedPlan.description,
        tasks: tasksPayload,
      });

      setSelectedPlan(updated);
      setActionPlans((prev) => {
        const byId = prev.findIndex((p) => p.id === selectedPlan.id);
        if (byId !== -1) {
          const next = [...prev];
          next[byId] = updated;
          return next;
        }
        const byCaseTitle = prev.findIndex(
          (p) => p.caseId === updated.caseId && p.title === updated.title
        );
        if (byCaseTitle !== -1) {
          const next = [...prev];
          next[byCaseTitle] = updated;
          return next;
        }
        return [...prev, updated];
      });
      await loadData();
      resetViewNewTaskForm();
    } catch (error) {
      console.error('Failed to add task to action plan:', error);
    } finally {
      setViewAddTaskSaving(false);
    }
  };

  const handleOpenEditPlan = (plan: ActionPlan) => {
    setEditingPlanId(plan.id);
    setEditPlanTitle(plan.title);
    setEditPlanDescription(plan.description);
    setEditPlanComment(
      typeof plan.comment === 'string' ? plan.comment : ''
    );
    setEditPlanDialogOpen(true);
  };

  const resetEditPlanForm = () => {
    setEditPlanDialogOpen(false);
    setEditingPlanId(null);
    setEditPlanTitle('');
    setEditPlanDescription('');
    setEditPlanComment('');
  };

  const handleCloseEditPlanDialog = () => {
    if (editPlanSaving) return;
    resetEditPlanForm();
  };

  const handleSaveEditedPlan = async () => {
    if (!editingPlanId || !editPlanTitle.trim()) return;

    setEditPlanSaving(true);
    try {
      const updated = await TaskApi.updateActionPlan(editingPlanId, {
        title: editPlanTitle.trim(),
        description: editPlanDescription.trim(),
        comment: editPlanComment.trim() === '' ? null : editPlanComment.trim(),
      });

      setActionPlans((prev) =>
        prev.map((p) =>
          p.id === editingPlanId
            ? {
                ...p,
                title: updated.title,
                description: updated.description,
                comment: updated.comment,
                incidentId: updated.incidentId ?? p.incidentId,
                caseId: updated.caseId,
              }
            : p
        )
      );

      if (selectedPlan?.id === editingPlanId) {
        setSelectedPlan((prev) =>
          prev
            ? {
                ...prev,
                title: updated.title,
                description: updated.description,
                comment: updated.comment,
                incidentId: updated.incidentId ?? prev.incidentId,
                caseId: updated.caseId,
              }
            : null
        );
      }

      resetEditPlanForm();
    } catch (error) {
      console.error('Failed to update action plan:', error);
    } finally {
      setEditPlanSaving(false);
    }
  };

  const handleSubmitPlanForVerification = async () => {
    if (!selectedPlan) return;

    try {
      await TaskApi.submitForVerification(selectedPlan.id);
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

  const handleOpenTaskDetails = async (task: Task) => {
    setSelectedTask(task);
    setDetailIncident(null);
    setDetailActionError(null);
    setTaskDetailsDialogOpen(true);
  };

  const handleOpenTaskActionPlan = async () => {
    if (!selectedTask?.actionPlanId) {
      setDetailActionError('Для задачи не передан идентификатор плана действий.');
      return;
    }
    try {
      setDetailActionError(null);
      const existingPlan = actionPlans.find((plan) => plan.id === selectedTask.actionPlanId);
      const plan = existingPlan ?? (await TaskApi.getActionPlan(selectedTask.actionPlanId));
      setSelectedPlan(plan);
      setViewPlanDialogOpen(true);
      setTaskDetailsDialogOpen(false);
    } catch (error) {
      console.error('Failed to load action plan details:', error);
      setDetailActionError('Не удалось открыть план действий.');
    }
  };

  const handleOpenTaskCase = async () => {
    if (!selectedTask?.caseId) {
      setDetailActionError('Для задачи не передан идентификатор случая.');
      return;
    }
    try {
      setDetailLoading(true);
      setDetailActionError(null);
      setCasePreviewOpen(true);
      setCasePreviewTab(0);
      setCasePreviewLoading(true);
      setCaseCommentsLoading(true);
      setCaseAttachmentsLoading(true);

      const [caseViewData, commentsData, attachmentsData] = await Promise.allSettled([
        CaseApi.getCaseViewFromCasesService(selectedTask.caseId),
        CaseApi.getCaseComments(selectedTask.caseId),
        CaseApi.getCaseAttachments(selectedTask.caseId),
      ]);

      setCasePreviewView(caseViewData.status === 'fulfilled' ? caseViewData.value : null);
      setCaseComments(commentsData.status === 'fulfilled' ? commentsData.value : []);
      setCaseAttachments(attachmentsData.status === 'fulfilled' ? attachmentsData.value : []);
      setTaskDetailsDialogOpen(false);
    } catch (error) {
      console.error('Failed to load case details:', error);
      setDetailActionError('Не удалось открыть случай.');
    } finally {
      setDetailLoading(false);
      setCasePreviewLoading(false);
      setCaseCommentsLoading(false);
      setCaseAttachmentsLoading(false);
    }
  };

  const handleAddCaseComment = async () => {
    if (!selectedTask?.caseId || !newCaseComment.trim()) return;
    try {
      await CaseApi.addCaseComment(selectedTask.caseId, newCaseComment.trim());
      const comments = await CaseApi.getCaseComments(selectedTask.caseId);
      setCaseComments(comments);
      setNewCaseComment('');
    } catch (error) {
      console.error('Failed to add case comment from tasks page:', error);
    }
  };

  const handleUploadCaseAttachmentFromTasks = async (file: File | null) => {
    if (!file || !selectedTask?.caseId) return;
    try {
      setCaseAttachmentsLoading(true);
      await CaseApi.uploadCaseAttachment(selectedTask.caseId, file);
      const attachments = await CaseApi.getCaseAttachments(selectedTask.caseId);
      setCaseAttachments(attachments);
    } catch (error) {
      console.error('Failed to upload case attachment from tasks page:', error);
    } finally {
      setCaseAttachmentsLoading(false);
    }
  };

  const handleDownloadCaseAttachmentFromTasks = async (attachment: CaseAttachment) => {
    if (!selectedTask?.caseId) return;
    try {
      setCaseAttachmentDownloadId(attachment.id);
      await CaseApi.downloadCaseAttachment(
        selectedTask.caseId,
        attachment.id,
        attachment.fileName
      );
    } catch (error) {
      console.error('Failed to download case attachment from tasks page:', error);
    } finally {
      setCaseAttachmentDownloadId(null);
    }
  };

  const handleDeleteCaseAttachmentFromTasks = async (attachment: CaseAttachment) => {
    if (!selectedTask?.caseId) return;
    try {
      setCaseAttachmentDeleteId(attachment.id);
      await CaseApi.deleteCaseAttachment(selectedTask.caseId, attachment.id);
      setCaseAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (error) {
      console.error('Failed to delete case attachment from tasks page:', error);
    } finally {
      setCaseAttachmentDeleteId(null);
    }
  };

  const stringifyValue = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (value && typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '-';
      }
    }
    return '-';
  };

  const getRiskSeverityLabel = (severity?: string): string => {
    if (!severity) return '-';
    const labels: Record<string, string> = {
      LOW: 'Низкая',
      MEDIUM: 'Средняя',
      HIGH: 'Высокая',
      CRITICAL: 'Критичная',
    };
    return labels[severity.toUpperCase()] || severity;
  };

  const getIncidentSeverityColor = (
    severity: Incident['severity']
  ): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
    }
  };

  const handleOpenTaskIncident = async () => {
    if (!selectedTask?.incidentId) {
      setDetailActionError('Для задачи не передан идентификатор инцидента.');
      return;
    }
    try {
      setDetailLoading(true);
      setIncidentPreviewLoading(true);
      setDetailActionError(null);
      const [incidentData, incidentView] = await Promise.all([
        IncidentApi.getIncident(selectedTask.incidentId),
        IncidentApi.getIncidentView(selectedTask.incidentId),
      ]);
      setDetailIncident(incidentData);
      setIncidentViewData(incidentView);
      setIncidentPreviewOpen(true);
      setTaskDetailsDialogOpen(false);
    } catch (error) {
      console.error('Failed to load incident details:', error);
      setDetailActionError('Не удалось открыть инцидент.');
    } finally {
      setDetailLoading(false);
      setIncidentPreviewLoading(false);
    }
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
      case 'URGENT': return 'warning';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'info';
      case 'LOW': return 'success';
    }
  };

  const getTaskPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT': return 'Высокий';
      case 'HIGH': return 'Высокий';
      case 'NORMAL': return 'Средний';
      case 'LOW': return 'Низкий';
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

  /** Статус случая из GET /api/action-plans → поле caseStatus (отдельного статуса плана нет) */
  const getCaseWorkflowStatusLabel = (caseStatus: string) => {
    return getCaseStatusLabelRu(caseStatus.trim().toUpperCase());
  };

  const getCaseWorkflowStatusColor = (caseStatus: string) => {
    const s = caseStatus.trim().toUpperCase();
    switch (s) {
      case 'OPEN': return 'info';
      case 'ASSIGNED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'INVESTIGATING': return 'primary';
      case 'ACTION_PLAN': return 'warning';
      case 'ACTION_IN_PROGRESS': return 'info';
      case 'WAITING_VERIFICATION': return 'secondary';
      case 'CLOSED': return 'success';
      case 'REJECTED': return 'error';
      case 'ESCALATED_TO_CASE': return 'warning';
      default: return 'default';
    }
  };

  const getActionPlanStatusLabel = (plan: ActionPlan) => {
    const cs = plan.caseStatus?.trim();
    if (!cs) return 'Не указан';
    return getCaseWorkflowStatusLabel(cs);
  };

  const getActionPlanStatusColor = (plan: ActionPlan) => {
    const cs = plan.caseStatus?.trim();
    if (!cs) return 'default';
    return getCaseWorkflowStatusColor(cs);
  };

  /** Отправка на утверждение доступна, пока случай в фазе плана действий */
  const canSubmitActionPlanForVerification = (plan: ActionPlan) =>
    plan.caseStatus?.trim().toUpperCase() === 'ACTION_PLAN';

  /** В фазе исполнения мероприятий добавлять новые задачи нельзя */
  const canAddTasksToPlan = (plan: ActionPlan) =>
    plan.caseStatus?.trim().toUpperCase() !== 'ACTION_IN_PROGRESS';

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
                              label={getTaskPriorityLabel(task.priority)}
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
                          <Tooltip title="Детализация">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleOpenTaskDetails(task);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
                              label={getTaskPriorityLabel(task.priority)}
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
                          <Tooltip title="Детализация">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleOpenTaskDetails(task);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
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
                        <CardActions>
                          <Tooltip title="Детализация">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleOpenTaskDetails(task);
                              }}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </CardActions>
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
                Планы создаются из карточки случая после расследования (кнопка «Создать план действий»).
              </Typography>
            </Alert>

            {actionPlans.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Нет планов действий
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Создайте план из раздела «Случаи»
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/manager/cases')}
                >
                  Перейти к случаям
                </Button>
              </Box>
            ) : (
              <List disablePadding sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {actionPlans.map((plan) => (
                  <Paper key={plan.id} variant="outlined" sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                      <AssignmentIcon color="primary" sx={{ mt: 0.25 }} />
                      <Box sx={{ flex: '1 1 220px', minWidth: 0 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {plan.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {plan.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, alignItems: 'center' }}>
                          {plan.riskObjectName?.trim() ? (
                            <Typography variant="caption" color="text.secondary" component="div">
                              План для случая с объектом{' '}
                              <Box component="span" sx={{ fontWeight: 700 }}>
                                {plan.riskObjectName}
                              </Box>
                            </Typography>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              Случай: {plan.caseTitle ?? plan.caseId}
                            </Typography>
                          )}
                          <Chip
                            label={getActionPlanStatusLabel(plan)}
                            color={getActionPlanStatusColor(plan)}
                            size="small"
                          />
                          <Typography variant="caption" color="text.secondary">
                            Задачи: {plan.completedTasks ?? 0}/{plan.totalTasks ?? plan.tasks.length}
                            {(plan.progressPercentage ?? 0) > 0 &&
                              ` · ${plan.progressPercentage}%`}
                          </Typography>
                        </Box>
                        {(plan.progressPercentage ?? 0) > 0 && (
                          <LinearProgress
                            variant="determinate"
                            value={plan.progressPercentage ?? 0}
                            sx={{ mt: 1, maxWidth: 360 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                        <Tooltip title="Просмотр">
                          <IconButton
                            color="primary"
                            aria-label="Просмотр плана"
                            onClick={() => handleOpenPlanDetails(plan)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton
                            color="secondary"
                            aria-label="Редактировать план"
                            onClick={() => handleOpenEditPlan(plan)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton
                            color="error"
                            aria-label="Удалить план"
                            onClick={() => void handleDeleteActionPlan(plan.id)}
                          >
                            <DeleteOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </List>
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
                        <MenuItem value="NORMAL">Средний</MenuItem>
                        <MenuItem value="HIGH">Высокий</MenuItem>
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
              <Alert severity="info" sx={{ mt: 1 }}>
                Задачи можно добавить позже на странице «Мои задачи» или при редактировании плана (если доступно в системе).
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
              disabled={
                !planTitle ||
                (planTasks.length > 0 && planTasks.some((t) => !t.title.trim()))
              }
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
                    label={getActionPlanStatusLabel(selectedPlan)}
                    color={getActionPlanStatusColor(selectedPlan)}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" paragraph>
                  {selectedPlan.description}
                </Typography>

                <ActionPlanRiskObjectCaption
                  riskObjectName={selectedPlan.riskObjectName}
                  caseTitle={selectedPlan.caseTitle}
                  caseId={selectedPlan.caseId}
                />

                <ActionPlanDetailsSection details={selectedPlan.details} />

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Прогресс:</strong> {selectedPlan.completedTasks ?? 0} из{' '}
                    {selectedPlan.totalTasks ?? selectedPlan.tasks.length} задач выполнено (
                    {selectedPlan.progressPercentage ?? 0}%)
                  </Typography>
                </Alert>

                <LinearProgress
                  variant="determinate"
                  value={selectedPlan.progressPercentage ?? 0}
                  sx={{ mb: 3, height: 8, borderRadius: 1 }}
                />

                <Typography variant="subtitle1" gutterBottom>
                  Задачи плана
                </Typography>
                <List>
                  {selectedPlan.tasks.map((task, taskIndex) => (
                    <ListItem
                      key={task.id || `plan-task-${taskIndex}`}
                      sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}
                    >
                      <ListItemIcon>
                        {task.status === 'DONE' ? <CheckIcon color="success" /> : <ScheduleIcon />}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip label={getTaskStatusLabel(task.status)} size="small" color={getTaskStatusColor(task.status)} />
                            <Chip label={getTaskPriorityLabel(task.priority)} size="small" color={getTaskPriorityColor(task.priority)} />
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" gutterBottom>
                  Добавить задачу
                </Typography>
                {!canAddTasksToPlan(selectedPlan) && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Добавление новых задач недоступно, когда план в статусе «Исполнение мероприятий».
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      required
                      label="Название"
                      value={viewNewTaskTitle}
                      onChange={(e) => setViewNewTaskTitle(e.target.value)}
                      disabled={viewAddTaskSaving || !canAddTasksToPlan(selectedPlan)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Описание"
                      multiline
                      minRows={2}
                      value={viewNewTaskDescription}
                      onChange={(e) => setViewNewTaskDescription(e.target.value)}
                      disabled={viewAddTaskSaving || !canAddTasksToPlan(selectedPlan)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth disabled={viewAddTaskSaving || !canAddTasksToPlan(selectedPlan)}>
                      <InputLabel>Приоритет</InputLabel>
                      <Select
                        value={viewNewTaskPriority}
                        label="Приоритет"
                        onChange={(e) =>
                          setViewNewTaskPriority(e.target.value as TaskPriority)
                        }
                      >
                        <MenuItem value="LOW">Низкий</MenuItem>
                        <MenuItem value="NORMAL">Средний</MenuItem>
                        <MenuItem value="HIGH">Высокий</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Срок выполнения"
                      type="date"
                      value={viewNewTaskDueDate.split('T')[0]}
                      onChange={(e) =>
                        setViewNewTaskDueDate(new Date(e.target.value).toISOString())
                      }
                      disabled={viewAddTaskSaving || !canAddTasksToPlan(selectedPlan)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      disabled={
                        viewAddTaskSaving ||
                        !canAddTasksToPlan(selectedPlan) ||
                        !viewNewTaskTitle.trim()
                      }
                      onClick={() => void handleAppendTaskToPlan()}
                    >
                      {viewAddTaskSaving ? 'Сохранение…' : 'Добавить задачу'}
                    </Button>
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setViewPlanDialogOpen(false)}>
                  Закрыть
                </Button>
                {canSubmitActionPlanForVerification(selectedPlan) && (
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

        <Dialog
          open={editPlanDialogOpen}
          onClose={handleCloseEditPlanDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Редактирование плана</Typography>
              <IconButton onClick={handleCloseEditPlanDialog} disabled={editPlanSaving}>
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Название плана"
              value={editPlanTitle}
              onChange={(e) => setEditPlanTitle(e.target.value)}
              sx={{ mb: 2 }}
              required
              disabled={editPlanSaving}
            />
            <TextField
              fullWidth
              label="Описание плана"
              multiline
              minRows={3}
              value={editPlanDescription}
              onChange={(e) => setEditPlanDescription(e.target.value)}
              disabled={editPlanSaving}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Комментарий"
              placeholder="Пустое поле отправит null"
              multiline
              minRows={2}
              value={editPlanComment}
              onChange={(e) => setEditPlanComment(e.target.value)}
              disabled={editPlanSaving}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={handleCloseEditPlanDialog} disabled={editPlanSaving}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSaveEditedPlan()}
              disabled={editPlanSaving || !editPlanTitle.trim()}
            >
              {editPlanSaving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </DialogActions>
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
                      label={getTaskPriorityLabel(selectedTask.priority)}
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
                <Button
                  variant="outlined"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    setTaskDialogOpen(false);
                    void handleOpenTaskDetails(selectedTask);
                  }}
                >
                  Детализация
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog
          open={taskDetailsDialogOpen}
          onClose={() => setTaskDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedTask && (
            <>
              <DialogTitle>Детализация задачи</DialogTitle>
              <DialogContent>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Название плана действий</Typography>
                      <Typography variant="body2">{String(selectedTask.actionPlanTitle ?? '-')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Статус случая</Typography>
                      <Typography variant="body2">
                        {selectedTask.caseStatus ? getCaseWorkflowStatusLabel(String(selectedTask.caseStatus)) : '-'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Описание плана действий</Typography>
                      <Typography variant="body2">{String(selectedTask.actionPlanDescription ?? '-')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Комментарий к плану действий</Typography>
                      <Typography variant="body2">{String(selectedTask.actionPlanComment ?? '-')}</Typography>
                    </Paper>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">Комментарий по задаче</Typography>
                      <Typography variant="body2">{String(selectedTask.comment ?? '-')}</Typography>
                    </Paper>
                  </Grid>
                </Grid>

                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="contained"
                    startIcon={<AssignmentIcon />}
                    onClick={() => void handleOpenTaskActionPlan()}
                    disabled={!selectedTask.actionPlanId}
                  >
                    Открыть план задач
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => void handleOpenTaskCase()}
                    disabled={!selectedTask.caseId}
                  >
                    Открыть случай
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => void handleOpenTaskIncident()}
                    disabled={!selectedTask.incidentId}
                  >
                    Открыть инцидент
                  </Button>
                </Stack>

                {detailLoading && (
                  <Box sx={{ py: 2, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={28} />
                  </Box>
                )}

                {detailActionError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {detailActionError}
                  </Alert>
                )}

              </DialogContent>
              <DialogActions>
                <Button onClick={() => setTaskDetailsDialogOpen(false)}>Закрыть</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog open={casePreviewOpen} onClose={() => setCasePreviewOpen(false)} maxWidth="md" fullWidth>
          {selectedTask?.caseId && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{selectedTask.title}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {selectedTask.caseId}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={selectedTask.caseStatus ? getCaseWorkflowStatusLabel(String(selectedTask.caseStatus)) : 'Статус не указан'}
                      color={selectedTask.caseStatus ? getCaseWorkflowStatusColor(String(selectedTask.caseStatus)) : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
              </DialogTitle>
              <Tabs value={casePreviewTab} onChange={(_, next) => setCasePreviewTab(next)} sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tab label="Описание" />
                <Tab label="Расследование" />
                <Tab label="Комментарии" icon={<Chip label={caseComments.length} size="small" />} iconPosition="end" />
                <Tab label="Вложения" icon={<Chip label={caseAttachments.length} size="small" />} iconPosition="end" />
              </Tabs>
              <DialogContent>
                <TabPanel value={casePreviewTab} index={0}>
                  <Typography variant="body1" paragraph>{selectedTask.description || '-'}</Typography>
                  {!casePreviewLoading && casePreviewView && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>Данные правила</Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Название правила</Typography>
                          <Typography variant="body2">{stringifyValue(casePreviewView.ruleName)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">ID правила</Typography>
                          <Typography variant="body2">{stringifyValue(casePreviewView.ruleId)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">Условие правила</Typography>
                          <Typography variant="body2">{stringifyValue(casePreviewView.ruleCondition)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">Результаты выявления риска</Typography>
                          <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                            <Typography variant="body2">
                              Заголовок: {stringifyValue((casePreviewView.details as Record<string, unknown> | undefined)?.title)}
                            </Typography>
                            <Typography variant="body2">
                              Критичность: {getRiskSeverityLabel(stringifyValue((casePreviewView.details as Record<string, unknown> | undefined)?.severity))}
                            </Typography>
                            <Typography variant="body2">
                              Описание: {stringifyValue((casePreviewView.details as Record<string, unknown> | undefined)?.description)}
                            </Typography>
                            <Typography variant="body2">
                              Рекомендация: {stringifyValue((casePreviewView.details as Record<string, unknown> | undefined)?.recommendation)}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </>
                  )}
                </TabPanel>

                <TabPanel value={casePreviewTab} index={1}>
                  <Typography variant="body2" paragraph>
                    Заметки: {stringifyValue(casePreviewView?.investigationNotes)}
                  </Typography>
                  <Typography variant="body2">
                    Первопричина: {stringifyValue(casePreviewView?.rootCause)}
                  </Typography>
                </TabPanel>

                <TabPanel value={casePreviewTab} index={2}>
                  {caseCommentsLoading ? <CircularProgress size={24} /> : (
                    <>
                      <List>
                        {caseComments.map((comment) => (
                          <ListItem key={comment.id}>
                            <ListItemText
                              primary={comment.authorName || 'Пользователь'}
                              secondary={`${comment.content} • ${comment.createdAt ? new Date(comment.createdAt).toLocaleString('ru-RU') : '-'}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                      <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          placeholder="Добавить комментарий..."
                          value={newCaseComment}
                          onChange={(e) => setNewCaseComment(e.target.value)}
                          multiline
                          maxRows={3}
                        />
                        <Button variant="contained" onClick={() => void handleAddCaseComment()} disabled={!newCaseComment.trim()}>
                          <CommentIcon />
                        </Button>
                      </Box>
                    </>
                  )}
                </TabPanel>

                <TabPanel value={casePreviewTab} index={3}>
                  {caseAttachmentsLoading ? <CircularProgress size={24} /> : (
                    <>
                      <Button component="label" variant="outlined" sx={{ mb: 2 }}>
                        Загрузить файл
                        <input
                          type="file"
                          hidden
                          onChange={(event) => {
                            const file = event.target.files?.[0] ?? null;
                            void handleUploadCaseAttachmentFromTasks(file);
                            event.target.value = '';
                          }}
                        />
                      </Button>
                      <List>
                        {caseAttachments.map((attachment) => (
                          <ListItem
                            key={attachment.id}
                            secondaryAction={
                              <Stack direction="row" spacing={1}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => void handleDownloadCaseAttachmentFromTasks(attachment)}
                                  disabled={caseAttachmentDownloadId === attachment.id}
                                >
                                  Скачать
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() => void handleDeleteCaseAttachmentFromTasks(attachment)}
                                  disabled={caseAttachmentDeleteId === attachment.id}
                                >
                                  Удалить
                                </Button>
                              </Stack>
                            }
                          >
                            <ListItemText
                              primary={attachment.fileName}
                              secondary={`${(attachment.fileSize / 1024).toFixed(2)} KB • ${getFileKindShortLabel(attachment.fileName, attachment.fileType)}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </TabPanel>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setCasePreviewOpen(false)}>Закрыть</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog open={incidentPreviewOpen} onClose={() => setIncidentPreviewOpen(false)} maxWidth="md" fullWidth>
          {detailIncident && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{detailIncident.riskObjectName || detailIncident.title}</Typography>
                    <Typography variant="caption" color="text.secondary">ID: {detailIncident.id}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={detailIncident.severity} color={getIncidentSeverityColor(detailIncident.severity)} size="small" />
                    <Chip label={getIncidentStatusLabelRu(detailIncident.status)} color={getCaseWorkflowStatusColor(detailIncident.status)} size="small" />
                  </Box>
                </Box>
              </DialogTitle>
              <DialogContent>
                {incidentPreviewLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Категория</Typography>
                        <Typography variant="body2">{detailIncident.category}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Дата обнаружения</Typography>
                        <Typography variant="body2">{new Date(detailIncident.detectedAt).toLocaleString('ru-RU')}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Интеграция</Typography>
                        <Typography variant="body2">{stringifyValue(incidentViewData?.integrationName)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">ID документа</Typography>
                        <Typography variant="body2">{stringifyValue(incidentViewData?.documentId)}</Typography>
                      </Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>Обнаруженные риски</Typography>
                    {!incidentViewData?.findings?.length ? (
                      <Alert severity="info">По этому инциденту не найдены findings.</Alert>
                    ) : (
                      <Stack spacing={1.5}>
                        {incidentViewData.findings.map((finding) => (
                          <Paper key={finding.id} variant="outlined" sx={{ p: 1.5 }}>
                            <Typography variant="caption" color="text.secondary">Finding ID</Typography>
                            <Typography variant="body2">{finding.id}</Typography>
                            <Typography variant="caption" color="text.secondary">Приоритет</Typography>
                            <Typography variant="body2">{finding.priority || '-'}</Typography>
                            <Typography variant="caption" color="text.secondary">Детали</Typography>
                            <Typography variant="body2">{stringifyValue(finding.details)}</Typography>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setIncidentPreviewOpen(false)}>Закрыть</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
});
