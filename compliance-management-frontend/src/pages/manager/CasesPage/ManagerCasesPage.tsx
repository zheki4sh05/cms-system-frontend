// src/pages/manager/CasesPage/CasesPage.tsx

import { type FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextareaAutosize,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  AttachFile as AttachIcon,
  Comment as CommentIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CaseApi } from '@shared/lib/api/caseApi';
import { getFileKindShortLabel } from '@shared/lib/fileDisplay';
import { getCaseStatusLabelRu } from '@shared/lib/statusLabels';
import { TaskApi } from '@shared/lib/api/taskApi';
import { RuleApi } from '@shared/lib/api/ruleApi';
import { IncidentApi } from '@shared/lib/api/incidentApi';
import { useAuthStore } from '@features/auth/useAuthStore';
import type {
  Case,
  CaseStatus,
  CaseSeverity,
  CasePriority,
  CaseComment,
  CaseAttachment,
  CaseStatistics,
  CaseViewItem,
} from '@shared/types/caseTypes';

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

export const ManagerCasesPage: FC = observer(() => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [statistics, setStatistics] = useState<CaseStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  
  // Данные для расследования
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [attachments, setAttachments] = useState<CaseAttachment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [investigationNotes, setInvestigationNotes] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [requiresAction, setRequiresAction] = useState(false);
  const [responsibleDisplayName, setResponsibleDisplayName] = useState<string>('-');
  const [caseViewData, setCaseViewData] = useState<CaseViewItem | null>(null);
  const [caseViewLoading, setCaseViewLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [responsibleLoading, setResponsibleLoading] = useState(false);
  const [attachmentDownloadId, setAttachmentDownloadId] = useState<string | null>(null);
  const [attachmentDeleteId, setAttachmentDeleteId] = useState<string | null>(null);

  const [actionPlanDialogOpen, setActionPlanDialogOpen] = useState(false);
  const [actionPlanTitle, setActionPlanTitle] = useState('');
  const [actionPlanDescription, setActionPlanDescription] = useState('');
  const [actionPlanSubmitting, setActionPlanSubmitting] = useState(false);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const casesData = await CaseApi.getMyCases();
      setCases(casesData);

      try {
        const statsData = await CaseApi.getCaseStatistics();
        setStatistics(statsData);
      } catch (statsError) {
        console.error('Failed to load case statistics:', statsError);
        setStatistics(null);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCase = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    setInvestigationNotes(caseItem.investigationNotes || '');
    setRootCause(caseItem.rootCause || '');
    setRequiresAction(caseItem.requiresCorrectiveAction);
    setResponsibleDisplayName(caseItem.ownerName || '-');
    setCaseViewData(null);
    setDialogOpen(true);

    setCaseViewLoading(true);
    setCommentsLoading(true);
    setAttachmentsLoading(true);
    setResponsibleLoading(true);

    // 1) Сначала загрузить view карточки case
    try {
      const viewData = await CaseApi.getCaseView(caseItem.caseId || caseItem.id);
      setCaseViewData(viewData);
      setInvestigationNotes(viewData.investigationNotes || caseItem.investigationNotes || '');
      setRootCause(viewData.rootCause || caseItem.rootCause || '');
      setRequiresAction(
        typeof viewData.requiresCorrectiveAction === 'boolean'
          ? viewData.requiresCorrectiveAction
          : caseItem.requiresCorrectiveAction
      );
    } catch (viewError) {
      console.error('Failed to load cases view data:', viewError);
      setCaseViewData(null);
    } finally {
      setCaseViewLoading(false);
    }

    // После view догружаем комментарии и вложения (независимо, чтобы ошибка одного не скрывала другой)
    const resolvedCaseId = caseItem.caseId || caseItem.id;
    setComments([]);
    setAttachments([]);

    try {
      const [commentsOutcome, attachmentsOutcome] = await Promise.allSettled([
        CaseApi.getCaseComments(resolvedCaseId),
        CaseApi.getCaseAttachments(resolvedCaseId),
      ]);

      if (commentsOutcome.status === 'fulfilled') {
        setComments(commentsOutcome.value);
      } else {
        console.error('Failed to load case comments:', commentsOutcome.reason);
        setComments([]);
      }

      if (attachmentsOutcome.status === 'fulfilled') {
        setAttachments(attachmentsOutcome.value);
      } else {
        console.error('Failed to load case attachments:', attachmentsOutcome.reason);
        setAttachments([]);
      }
    } finally {
      setCommentsLoading(false);
      setAttachmentsLoading(false);
    }

    // Определить ответственного как в окне инцидента:
    // rule -> responsibleUserId -> Вы/имя пользователя
    try {
      const rule = await RuleApi.getRuleShort(caseItem.ruleId || caseItem.id);
      const responsibleUserId = rule.responsibleUserId;
      if (responsibleUserId && responsibleUserId === authStore.user?.id) {
        setResponsibleDisplayName('Вы');
      } else if (responsibleUserId) {
        const user = await IncidentApi.getUserBasicInfo(responsibleUserId);
        const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
        setResponsibleDisplayName(user.fullName || fullName || user.email || responsibleUserId);
      } else {
        setResponsibleDisplayName('-');
      }
    } catch (responsibleError) {
      console.error('Failed to load responsible user for case:', responsibleError);
      setResponsibleDisplayName(caseItem.ownerName || '-');
    } finally {
      setResponsibleLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedCase(null);
    setTabValue(0);
    setComments([]);
    setAttachments([]);
    setNewComment('');
    setResponsibleDisplayName('-');
    setCaseViewData(null);
    setCaseViewLoading(false);
    setCommentsLoading(false);
    setAttachmentsLoading(false);
    setResponsibleLoading(false);
    setAttachmentDownloadId(null);
    setAttachmentDeleteId(null);
    setActionPlanDialogOpen(false);
    setActionPlanTitle('');
    setActionPlanDescription('');
    setActionPlanSubmitting(false);
  };

  const handleOpenActionPlanDialog = () => {
    if (!selectedCase) return;
    const caseId = selectedCase.caseId || selectedCase.id;
    setActionPlanTitle(`План корректирующих действий для случая ${caseId}`);
    setActionPlanDescription(
      selectedCase.rootCause?.trim() ? selectedCase.rootCause.trim() : ''
    );
    setActionPlanDialogOpen(true);
  };

  const handleSubmitActionPlan = async () => {
    if (!selectedCase || !actionPlanTitle.trim()) return;
    const caseId = selectedCase.caseId || selectedCase.id;
    setActionPlanSubmitting(true);
    try {
      await TaskApi.createActionPlan({
        caseId,
        title: actionPlanTitle.trim(),
        description: actionPlanDescription.trim(),
        tasks: [],
      });
      await loadCases();
      setActionPlanDialogOpen(false);
      setActionPlanTitle('');
      setActionPlanDescription('');
      handleCloseDialog();
      navigate('/manager/tasks', { state: { tasksTab: 'action-plans' } });
    } catch (error) {
      console.error('Failed to create action plan:', error);
    } finally {
      setActionPlanSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedCase || !newComment.trim()) return;
    
    try {
      const comment = await CaseApi.addCaseComment(
        selectedCase.caseId || selectedCase.id,
        newComment
      );
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCase || !event.target.files?.length) return;
    
    const file = event.target.files[0];
    try {
      const attachment = await CaseApi.uploadCaseAttachment(
        selectedCase.caseId || selectedCase.id,
        file
      );
      setAttachments([...attachments, attachment]);
    } catch (error) {
      console.error('Failed to upload file:', error);
    }
  };

  const handleDownloadAttachment = async (attachment: CaseAttachment) => {
    if (!selectedCase?.id) return;
    const caseId = selectedCase.caseId || selectedCase.id;
    setAttachmentDownloadId(attachment.id);
    try {
      await CaseApi.downloadCaseAttachment(caseId, attachment.id, attachment.fileName);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    } finally {
      setAttachmentDownloadId(null);
    }
  };

  const handleDeleteAttachment = async (attachment: CaseAttachment) => {
    if (!selectedCase?.id) return;
    const caseId = selectedCase.caseId || selectedCase.id;
    setAttachmentDeleteId(attachment.id);
    try {
      await CaseApi.deleteCaseAttachment(caseId, attachment.id);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setAttachmentDeleteId(null);
    }
  };

  const handleSaveInvestigation = async () => {
    if (!selectedCase) return;
    
    try {
      await CaseApi.updateInvestigation(selectedCase.caseId || selectedCase.id, {
        investigationNotes,
        rootCause,
        requiresCorrectiveAction: requiresAction,
      });
      
      await loadCases();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to save investigation:', error);
    }
  };

  const handleCloseCase = async () => {
    if (!selectedCase) return;
    
    try {
      await CaseApi.closeCase(
        selectedCase.caseId || selectedCase.id,
        rootCause || 'Расследование завершено'
      );
      await loadCases();
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to close case:', error);
    }
  };

  const getSeverityColor = (severity: CaseSeverity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
    }
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'OPEN': return 'info';
      case 'ASSIGNED': return 'primary';
      case 'IN_PROGRESS': return 'warning';
      case 'INVESTIGATING': return 'primary';
      case 'ACTION_PLAN': return 'warning';
      case 'ACTION_IN_PROGRESS': return 'info';
      case 'WAITING_VERIFICATION': return 'secondary';
      case 'CLOSED': return 'success';
      case 'REJECTED': return 'error';
    }
  };

  const getStatusLabel = (status: CaseStatus) => {
    return getCaseStatusLabelRu(status);
  };

  const getPriorityLabel = (priority: CasePriority): string => {
    const labels: Record<CasePriority, string> = {
      LOW: 'Низкий',
      NORMAL: 'Средний',
      HIGH: 'Высокий',
      URGENT: 'Высокий',
    };
    return labels[priority];
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

  const isInvestigationEditable =
    selectedCase?.status === 'INVESTIGATING' || selectedCase?.status === 'ASSIGNED';

  const filteredCases = cases.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Случаи
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {/* TODO: Create case dialog */}}
          >
            Создать случай
          </Button>
        </Box>

        {/* Статистика */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">{statistics.open}</Typography>
                  <Typography variant="body2" color="text.secondary">Открыто</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">{statistics.inProgress}</Typography>
                  <Typography variant="body2" color="text.secondary">В работе</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">{statistics.investigation}</Typography>
                  <Typography variant="body2" color="text.secondary">Расследование</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary.main">{statistics.pendingVerification}</Typography>
                  <Typography variant="body2" color="text.secondary">На проверке</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">{statistics.closed}</Typography>
                  <Typography variant="body2" color="text.secondary">Закрыто</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 2}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4">{statistics.avgResolutionTime}ч</Typography>
                  <Typography variant="body2" color="text.secondary">Ср. время</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Поиск */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Поиск по названию, описанию или ID случая..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Таблица случаев */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Приоритет</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Срок</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases.map((caseItem, index) => (
                <TableRow key={caseItem.id} hover>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {caseItem.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getPriorityLabel(caseItem.priority)}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(caseItem.status)}
                      color={getStatusColor(caseItem.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {caseItem.dueDate ? new Date(caseItem.dueDate).toLocaleDateString('ru-RU') : 'Не задано'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Открыть">
                      <IconButton size="small" color="primary" onClick={() => handleOpenCase(caseItem)}>
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Диалог расследования случая */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedCase && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{selectedCase.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {selectedCase.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={selectedCase.severity}
                      color={getSeverityColor(selectedCase.severity)}
                      size="small"
                    />
                    <Chip
                      label={getStatusLabel(selectedCase.status)}
                      color={getStatusColor(selectedCase.status)}
                      size="small"
                    />
                    <IconButton onClick={handleCloseDialog} size="small">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
              </DialogTitle>

              <Tabs
                value={tabValue}
                onChange={(_, newValue) => setTabValue(newValue)}
                sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}
              >
                <Tab label="Описание" />
                <Tab label="Расследование" />
                <Tab
                  label="Комментарии"
                  icon={
                    commentsLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 28, justifyContent: 'center' }}>
                        <CircularProgress size={14} thickness={5} />
                      </Box>
                    ) : (
                      <Chip label={comments.length} size="small" />
                    )
                  }
                  iconPosition="end"
                />
                <Tab
                  label="Вложения"
                  icon={
                    attachmentsLoading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 28, justifyContent: 'center' }}>
                        <CircularProgress size={14} thickness={5} />
                      </Box>
                    ) : (
                      <Chip label={attachments.length} size="small" />
                    )
                  }
                  iconPosition="end"
                />
              </Tabs>

              <DialogContent>
                {/* Вкладка "Описание" */}
                <TabPanel value={tabValue} index={0}>
                  <Typography variant="body1" paragraph>
                    {selectedCase.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    <Grid size={{xs: 6}}>
                      <Typography variant="caption" color="text.secondary">Создан</Typography>
                      <Typography variant="body2">
                        {new Date(selectedCase.createdAt).toLocaleString('ru-RU')}
                      </Typography>
                    </Grid>
                    <Grid size={{xs: 6}}>
                      <Typography variant="caption" color="text.secondary">Обновлен</Typography>
                      <Typography variant="body2">
                        {new Date(selectedCase.updatedAt).toLocaleString('ru-RU')}
                      </Typography>
                    </Grid>
                    <Grid size={{xs: 6}}>
                      <Typography variant="caption" color="text.secondary">Ответственный</Typography>
                      <Box sx={{ minHeight: 24, display: 'flex', alignItems: 'center', gap: 1 }}>
                        {responsibleLoading && <CircularProgress size={18} />}
                        {!responsibleLoading && (
                          <Typography variant="body2">{responsibleDisplayName}</Typography>
                        )}
                      </Box>
                    </Grid>
                    <Grid size={{xs: 6}}>
                      <Typography variant="caption" color="text.secondary">Связанные инциденты</Typography>
                      <Typography variant="body2">{selectedCase.incidentIds.length}</Typography>
                    </Grid>
                  </Grid>

                  {caseViewLoading && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          py: 4,
                        }}
                      >
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary">
                          Загрузка данных правила…
                        </Typography>
                      </Box>
                    </>
                  )}
                  {!caseViewLoading && caseViewData && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="subtitle2" gutterBottom>
                        Данные правила
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Название правила</Typography>
                          <Typography variant="body2">{stringifyValue(caseViewData.ruleName)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">ID правила</Typography>
                          <Typography variant="body2">{stringifyValue(caseViewData.ruleId)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">Условие правила</Typography>
                          <Typography variant="body2">{stringifyValue(caseViewData.ruleCondition)}</Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">
                            Результаты выявления риска
                          </Typography>
                          <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                            <Grid container spacing={1.5}>
                              <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary">Заголовок</Typography>
                                <Typography variant="body2">
                                  {stringifyValue((caseViewData.details as Record<string, unknown> | undefined)?.title)}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary">Критичность риска</Typography>
                                <Typography variant="body2">
                                  {getRiskSeverityLabel(
                                    stringifyValue(
                                      (caseViewData.details as Record<string, unknown> | undefined)?.severity
                                    )
                                  )}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary">Описание</Typography>
                                <Typography variant="body2">
                                  {stringifyValue(
                                    (caseViewData.details as Record<string, unknown> | undefined)?.description
                                  )}
                                </Typography>
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" color="text.secondary">Рекомендация</Typography>
                                <Typography variant="body2">
                                  {stringifyValue(
                                    (caseViewData.details as Record<string, unknown> | undefined)?.recommendation
                                  )}
                                </Typography>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      </Grid>
                    </>
                  )}
                  {selectedCase.tags.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="caption" color="text.secondary">Теги</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                        {selectedCase.tags.map(tag => (
                          <Chip key={tag} label={tag} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </>
                  )}
                </TabPanel>

                {/* Вкладка "Расследование" */}
                <TabPanel value={tabValue} index={1}>
                  {!isInvestigationEditable && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Редактирование расследования доступно только для случаев в статусе ASSIGNED или INVESTIGATING.
                    </Alert>
                  )}

                  {caseViewLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <CircularProgress size={22} />
                      <Typography variant="body2" color="text.secondary">
                        Загрузка сведений о расследовании…
                      </Typography>
                    </Box>
                  )}
                  {!caseViewLoading && caseViewData?.updatedAt && (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="caption" color="text.secondary">Обновлено</Typography>
                      <Typography variant="body2">
                        {new Date(caseViewData.updatedAt).toLocaleString('ru-RU')}
                      </Typography>
                    </Paper>
                  )}

                  <Alert severity="info" sx={{ mb: 3 }}>
                    <Typography variant="body2">
                      Проведите расследование случая, определите первопричину и решите, требуются ли корректирующие действия.
                    </Typography>
                  </Alert>

                  <TextField
                    fullWidth
                    label="Заметки по расследованию"
                    multiline
                    rows={4}
                    value={investigationNotes}
                    onChange={(e) => setInvestigationNotes(e.target.value)}
                    placeholder="Опишите ход расследования, найденные факты и промежуточные выводы..."
                    sx={{ mb: 3 }}
                    disabled={!isInvestigationEditable || caseViewLoading}
                  />

                  <TextField
                    fullWidth
                    label="Первопричина (Root Cause)"
                    multiline
                    rows={3}
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    placeholder="Укажите выявленную первопричину нарушения..."
                    sx={{ mb: 3 }}
                    disabled={!isInvestigationEditable || caseViewLoading}
                  />

                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Требуются корректирующие действия?</InputLabel>
                    <Select
                      value={requiresAction ? 'yes' : 'no'}
                      onChange={(e) => setRequiresAction(e.target.value === 'yes')}
                      label="Требуются корректирующие действия?"
                    disabled={!isInvestigationEditable || caseViewLoading}
                    >
                      <MenuItem value="no">Нет, закрыть случай</MenuItem>
                      <MenuItem value="yes">Да, создать план действий</MenuItem>
                    </Select>
                  </FormControl>

                  {requiresAction && (
                    <Alert severity="warning">
                      <Typography variant="body2">
                        После сохранения вы сможете создать план корректирующих действий на странице "Мои задачи".
                      </Typography>
                    </Alert>
                  )}
                </TabPanel>

                {/* Вкладка "Комментарии" */}
                <TabPanel value={tabValue} index={2}>
                  {commentsLoading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        py: 6,
                      }}
                    >
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary">
                        Загрузка комментариев…
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {comments.map((comment) => (
                        <Box key={comment.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemAvatar>
                              <Avatar>{(comment.authorName || '?').charAt(0)}</Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={comment.authorName || 'Неизвестный автор'}
                              secondary={
                                <>
                                  <Typography variant="body2" component="span" sx={{ display: 'block', mt: 1 }}>
                                    {comment.content}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {comment.createdAt
                                      ? new Date(comment.createdAt).toLocaleString('ru-RU')
                                      : '-'}
                                  </Typography>
                                </>
                              }
                            />
                          </ListItem>
                          <Divider variant="inset" component="li" />
                        </Box>
                      ))}
                    </List>
                  )}

                  <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      placeholder="Добавить комментарий..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      multiline
                      maxRows={3}
                      disabled={commentsLoading}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddComment}
                      disabled={commentsLoading || !newComment.trim()}
                    >
                      <CommentIcon />
                    </Button>
                  </Box>
                </TabPanel>

                {/* Вкладка "Вложения" */}
                <TabPanel value={tabValue} index={3}>
                  {attachmentsLoading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        py: 6,
                      }}
                    >
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary">
                        Загрузка вложений…
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {attachments.map((attachment) => (
                        <ListItem
                          key={attachment.id}
                          secondaryAction={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={
                                  attachmentDownloadId === attachment.id ? (
                                    <CircularProgress size={16} />
                                  ) : undefined
                                }
                                onClick={() => void handleDownloadAttachment(attachment)}
                                disabled={
                                  attachmentsLoading ||
                                  attachmentDownloadId === attachment.id ||
                                  attachmentDeleteId === attachment.id
                                }
                              >
                                Скачать
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={
                                  attachmentDeleteId === attachment.id ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <DeleteOutlineIcon />
                                  )
                                }
                                onClick={() => void handleDeleteAttachment(attachment)}
                                disabled={
                                  attachmentsLoading ||
                                  attachmentDownloadId === attachment.id ||
                                  attachmentDeleteId === attachment.id
                                }
                              >
                                Удалить
                              </Button>
                            </Stack>
                          }
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <AttachIcon />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={attachment.fileName}
                            secondary={
                              <>
                                <Typography variant="caption" component="span">
                                  {(attachment.fileSize / 1024).toFixed(2)} KB •{' '}
                                  {getFileKindShortLabel(attachment.fileName, attachment.fileType)}
                                </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(attachment.uploadedAt).toLocaleString('ru-RU')}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachIcon />}
                    fullWidth
                    sx={{ mt: 2 }}
                    disabled={attachmentsLoading}
                  >
                    Загрузить файл
                    <input type="file" hidden onChange={handleFileUpload} disabled={attachmentsLoading} />
                  </Button>
                </TabPanel>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleCloseDialog}>
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleSaveInvestigation}
                  startIcon={<CheckIcon />}
                  disabled={!isInvestigationEditable || !investigationNotes.trim() || !rootCause.trim()}
                >
                  Сохранить расследование
                </Button>
                {requiresAction ? (
                  <Button
                    variant="contained"
                    onClick={handleOpenActionPlanDialog}
                    startIcon={<AddIcon />}
                  >
                    Создать план действий
                  </Button>
                ) : (
                  selectedCase?.status !== 'ACTION_PLAN' && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCloseCase}
                      startIcon={<CloseIcon />}
                    >
                      Закрыть случай
                    </Button>
                  )
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog
          open={actionPlanDialogOpen}
          onClose={() => !actionPlanSubmitting && setActionPlanDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Создание плана действий</DialogTitle>
          <DialogContent>
            {selectedCase && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Случай: {selectedCase.title} ({selectedCase.caseId || selectedCase.id})
              </Typography>
            )}
            <TextField
              fullWidth
              label="Название плана"
              value={actionPlanTitle}
              onChange={(e) => setActionPlanTitle(e.target.value)}
              sx={{ mb: 2 }}
              required
              disabled={actionPlanSubmitting}
            />
            <TextField
              fullWidth
              label="Описание"
              placeholder="Краткое описание плана / основание"
              multiline
              minRows={3}
              value={actionPlanDescription}
              onChange={(e) => setActionPlanDescription(e.target.value)}
              disabled={actionPlanSubmitting}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setActionPlanDialogOpen(false)} disabled={actionPlanSubmitting}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSubmitActionPlan()}
              disabled={actionPlanSubmitting || !actionPlanTitle.trim()}
            >
              {actionPlanSubmitting ? 'Создание…' : 'Создать'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
});
