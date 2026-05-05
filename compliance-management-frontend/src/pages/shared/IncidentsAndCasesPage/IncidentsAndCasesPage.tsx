import { type FC, useCallback, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Alert,
  Avatar,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import {
  AttachFile as AttachFileIcon,
  DeleteOutline as DeleteOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  FolderOpen as CaseIcon,
  OpenInNew as OpenInNewIcon,
  ReportProblem as IncidentIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Task as TaskIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { CaseApi } from '@shared/lib/api/caseApi';
import { IncidentApi } from '@shared/lib/api/incidentApi';
import { getCaseStatusLabelRu, getIncidentStatusLabelRu } from '@shared/lib/statusLabels';
import { TaskApi } from '@shared/lib/api/taskApi';
import type { IncidentReportCase, IncidentReportItem, IncidentReportsPageResult } from '@shared/types/incidentTypes';

const DEFAULT_PAGE_SIZE = 10;

const getStatusChipColor = (
  status: string
): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
  const normalized = status.toUpperCase();
  if (normalized.includes('CRITICAL') || normalized.includes('REJECT')) return 'error';
  if (normalized.includes('NEW') || normalized.includes('OPEN') || normalized.includes('TODO')) return 'warning';
  if (normalized.includes('DONE') || normalized.includes('CLOSED') || normalized.includes('RESOLVED')) return 'success';
  if (normalized.includes('PROGRESS') || normalized.includes('REVIEW')) return 'info';
  return 'default';
};

const formatDateTime = (value: string | undefined): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU');
};

const formatUnknown = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (!value) return '-';
  try {
    return JSON.stringify(value);
  } catch {
    return '-';
  }
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    LOW: 'Низкий',
    MEDIUM: 'Средний',
    NORMAL: 'Средний',
    HIGH: 'Высокий',
    URGENT: 'Критичный',
    CRITICAL: 'Критичный',
  };
  const normalized = priority.toUpperCase();
  return labels[normalized] ?? priority;
};

const getRuleNameLabel = (ruleName: unknown, findingId: string): string => {
  const formatted = formatUnknown(ruleName);
  return formatted === '-' ? findingId : formatted;
};

const getAssigneeFullName = (assignedUserId: unknown): string => {
  if (!assignedUserId || typeof assignedUserId !== 'object') return 'Не назначен';
  const user = assignedUserId as Record<string, unknown>;
  const firstName = typeof user.firstName === 'string' ? user.firstName.trim() : '';
  const lastName = typeof user.lastName === 'string' ? user.lastName.trim() : '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'Не назначен';
};

const getCommentAuthorName = (comment: IncidentReportCase['comments'][number]): string => {
  const fullName = `${comment.firstName ?? ''} ${comment.lastName ?? ''}`.trim();
  return fullName || 'Пользователь';
};

const getAttachmentAuthorName = (attachment: IncidentReportCase['attachments'][number]): string => {
  const fullName = `${attachment.firstName ?? ''} ${attachment.lastName ?? ''}`.trim();
  return fullName || 'Пользователь';
};

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const renderCaseMeta = (caseItem: IncidentReportCase) => {
  const commentsCount = caseItem.comments.length;
  const attachmentsCount = caseItem.attachments.length;
  const tasksCount = caseItem.actionPlan?.tasks.length ?? 0;

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip size="small" label={`Комментарии: ${commentsCount}`} variant="outlined" />
      <Chip size="small" label={`Вложения: ${attachmentsCount}`} variant="outlined" />
      <Chip size="small" label={`Задач в плане: ${tasksCount}`} variant="outlined" />
      {caseItem.investigation?.requiresCorrectiveAction && (
        <Chip size="small" color="warning" label="Требуются корректирующие действия" />
      )}
    </Stack>
  );
};

export const IncidentsAndCasesPage: FC = observer(() => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<IncidentReportsPageResult | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGE_SIZE);
  const [selectedIncidentReport, setSelectedIncidentReport] = useState<IncidentReportItem | null>(null);
  const [commentDraftByCase, setCommentDraftByCase] = useState<Record<string, string>>({});
  const [commentSubmittingCaseId, setCommentSubmittingCaseId] = useState<string | null>(null);
  const [fileUploadingCaseId, setFileUploadingCaseId] = useState<string | null>(null);
  const [fileDeletingAttachmentId, setFileDeletingAttachmentId] = useState<string | null>(null);
  const [planDecisionDialogOpen, setPlanDecisionDialogOpen] = useState(false);
  const [planDecisionType, setPlanDecisionType] = useState<'confirm' | 'revision'>('confirm');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [planDecisionComment, setPlanDecisionComment] = useState('');
  const [planDecisionSubmitting, setPlanDecisionSubmitting] = useState(false);
  const [planDecisionError, setPlanDecisionError] = useState<string | null>(null);

  const refreshReports = useCallback(async (keepSelectedIncidentId?: string) => {
    try {
      const response = await IncidentApi.getIncidentReports(page, rowsPerPage);
      setData(response);
      if (keepSelectedIncidentId) {
        const nextSelected = response.items.find((item) => item.incident.id === keepSelectedIncidentId) ?? null;
        setSelectedIncidentReport(nextSelected);
      }
    } catch (refreshError) {
      console.error('Failed to refresh incidents report:', refreshError);
    }
  }, [page, rowsPerPage]);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshReports();
      } catch (loadError) {
        console.error('Failed to load incidents report:', loadError);
        setError('Не удалось загрузить отчет по инцидентам и случаям.');
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, [refreshReports]);

  const filteredItems = useMemo(() => {
    const rawItems = data?.items ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return rawItems;

    return rawItems.filter((item) => {
      if (
        item.incident.id.toLowerCase().includes(query) ||
        item.incident.status.toLowerCase().includes(query)
      ) {
        return true;
      }

      return item.findings.some((finding) => {
        if (finding.id.toLowerCase().includes(query) || finding.priority.toLowerCase().includes(query)) {
          return true;
        }
        return finding.cases.some((caseItem) => {
          return (
            caseItem.id.toLowerCase().includes(query) ||
            caseItem.status.toLowerCase().includes(query) ||
            caseItem.actionPlan?.tasks.some((task) => task.title.toLowerCase().includes(query)) === true
          );
        });
      });
    });
  }, [data?.items, search]);

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    const findingsCount = items.reduce((acc, item) => acc + item.findings.length, 0);
    const casesCount = items.reduce(
      (acc, item) => acc + item.findings.reduce((findingAcc, finding) => findingAcc + finding.cases.length, 0),
      0
    );
    return {
      incidentsCount: data?.total ?? items.length,
      findingsCount,
      casesCount,
    };
  }, [data]);

  const handleAddComment = async (caseId: string, incidentId: string) => {
    const draft = commentDraftByCase[caseId]?.trim();
    if (!draft) return;
    try {
      setCommentSubmittingCaseId(caseId);
      await CaseApi.addCaseComment(caseId, draft);
      setCommentDraftByCase((prev) => ({ ...prev, [caseId]: '' }));
      await refreshReports(incidentId);
    } catch (commentError) {
      console.error('Failed to add case comment:', commentError);
    } finally {
      setCommentSubmittingCaseId(null);
    }
  };

  const handleUploadAttachment = async (caseId: string, incidentId: string, file: File | null) => {
    if (!file) return;
    try {
      setFileUploadingCaseId(caseId);
      await CaseApi.uploadCaseAttachment(caseId, file);
      await refreshReports(incidentId);
    } catch (uploadError) {
      console.error('Failed to upload case attachment:', uploadError);
    } finally {
      setFileUploadingCaseId(null);
    }
  };

  const handleDeleteAttachment = async (caseId: string, attachmentId: string, incidentId: string) => {
    try {
      setFileDeletingAttachmentId(attachmentId);
      await CaseApi.deleteCaseAttachment(caseId, attachmentId);
      await refreshReports(incidentId);
    } catch (deleteError) {
      console.error('Failed to delete case attachment:', deleteError);
    } finally {
      setFileDeletingAttachmentId(null);
    }
  };

  const openPlanDecisionDialog = (planId: string, type: 'confirm' | 'revision') => {
    setSelectedPlanId(planId);
    setPlanDecisionType(type);
    setPlanDecisionComment('');
    setPlanDecisionError(null);
    setPlanDecisionDialogOpen(true);
  };

  const handleSubmitPlanDecision = async () => {
    if (!selectedPlanId || !selectedIncidentReport) return;
    if (!planDecisionComment.trim()) {
      setPlanDecisionError('Комментарий обязателен.');
      return;
    }

    try {
      setPlanDecisionSubmitting(true);
      setPlanDecisionError(null);
      if (planDecisionType === 'confirm') {
        await TaskApi.confirmActionPlan(selectedPlanId, planDecisionComment.trim());
      } else {
        await TaskApi.returnActionPlanForRevision(selectedPlanId, planDecisionComment.trim());
      }
      await refreshReports(selectedIncidentReport.incident.id);
      setPlanDecisionDialogOpen(false);
    } catch (decisionError) {
      console.error('Failed to submit action plan decision:', decisionError);
      setPlanDecisionError('Не удалось отправить решение по плану действий.');
    } finally {
      setPlanDecisionSubmitting(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Инциденты и случаи
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Единый реестр инцидентов, findings и связанных случаев с постраничной загрузкой.
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Всего инцидентов
                </Typography>
                <Typography variant="h5">{stats.incidentsCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Всего findings
                </Typography>
                <Typography variant="h5">{stats.findingsCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  Всего случаев
                </Typography>
                <Typography variant="h5">{stats.casesCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Поиск по ID инцидента, finding, случая или статусу..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Paper>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && filteredItems.length === 0 && (
          <Alert severity="info">По заданному фильтру нет данных.</Alert>
        )}

        {!loading &&
          !error &&
          filteredItems.map((item) => (
            <Accordion key={item.incident.id} sx={{ mb: 1.5 }} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ width: '100%' }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                    <IncidentIcon color="error" fontSize="small" />
                    <Typography variant="subtitle1">
                      Инцидент связан с документом {formatUnknown(item.incident.documentId)}
                    </Typography>
                    <Chip
                      label={getIncidentStatusLabelRu(item.incident.status)}
                      color={getStatusChipColor(item.incident.status)}
                      size="small"
                    />
                    <Chip label={`Обнаружения: ${item.findings.length}`} size="small" variant="outlined" />
                  </Stack>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<OpenInNewIcon fontSize="small" />}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedIncidentReport(item);
                    }}
                  >
                    Открыть
                  </Button>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Интеграция: {formatUnknown(item.incident.integrationName)} | Рисковый объект:{' '}
                  {formatUnknown(item.incident.riskObjectName)}
                </Typography>
                <Divider sx={{ mb: 1.5 }} />

                {item.findings.map((finding) => (
                  <Paper key={finding.id} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2">
                        Обнаружение: {getRuleNameLabel(finding.ruleName, finding.id)}
                      </Typography>
                      <Chip label={`Приоритет: ${getPriorityLabel(finding.priority)}`} size="small" color="warning" />
                      <Chip label={`Случаев: ${finding.cases.length}`} size="small" variant="outlined" />
                    </Stack>

                    {finding.cases.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        Связанные случаи отсутствуют.
                      </Typography>
                    ) : (
                      <Stack spacing={1.5}>
                        {finding.cases.map((caseItem) => (
                          <Paper key={caseItem.id} sx={{ p: 1.5, bgcolor: 'grey.50' }} variant="outlined">
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              justifyContent="space-between"
                              flexWrap="wrap"
                              useFlexGap
                            >
                              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <CaseIcon fontSize="small" color="primary" />
                                <Typography variant="body2" fontWeight={600}>
                                  Ответственный за случай:{' '}
                                  {getAssigneeFullName(caseItem.assignedUserId ?? finding.assignedUserId)}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={getCaseStatusLabelRu(caseItem.status)}
                                  color={getStatusChipColor(caseItem.status)}
                                />
                                <Chip size="small" variant="outlined" label={`ID случая: ${caseItem.id}`} />
                              </Stack>
                              <Typography variant="caption" color="text.secondary">
                                Обновлено: {formatDateTime(caseItem.investigation?.updatedAt)}
                              </Typography>
                            </Stack>

                            <Box sx={{ mt: 1.5 }}>{renderCaseMeta(caseItem)}</Box>

                            {caseItem.actionPlan?.tasks.length ? (
                              <Box sx={{ mt: 1.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  Прогресс задач
                                </Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={
                                    (caseItem.actionPlan.tasks.filter((task) => task.status === 'DONE').length /
                                      caseItem.actionPlan.tasks.length) *
                                    100
                                  }
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            ) : null}
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Paper>
                ))}
              </AccordionDetails>
            </Accordion>
          ))}

        <Paper sx={{ mt: 2 }}>
          <TablePagination
            component="div"
            count={data?.total ?? 0}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              const nextLimit = Number(event.target.value);
              setRowsPerPage(nextLimit);
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20, 50]}
            labelRowsPerPage="На странице"
          />
        </Paper>

        <Dialog
          open={Boolean(selectedIncidentReport)}
          onClose={() => setSelectedIncidentReport(null)}
          maxWidth="md"
          fullWidth
        >
          {selectedIncidentReport && (
            <>
              <DialogTitle>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Typography variant="h6">
                    Инцидент связан с документом {formatUnknown(selectedIncidentReport.incident.documentId)}
                  </Typography>
                  <Chip
                    label={getIncidentStatusLabelRu(selectedIncidentReport.incident.status)}
                    color={getStatusChipColor(selectedIncidentReport.incident.status)}
                    size="small"
                  />
                </Stack>
              </DialogTitle>
              <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  companyId: {selectedIncidentReport.incident.companyId || '-'} | integrationId:{' '}
                  {selectedIncidentReport.incident.integrationId} | Интеграция:{' '}
                  {formatUnknown(selectedIncidentReport.incident.integrationName)} | Рисковый объект:{' '}
                  {formatUnknown(selectedIncidentReport.incident.riskObjectName)}
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {selectedIncidentReport.findings.map((finding) => (
                  <Paper key={finding.id} variant="outlined" sx={{ p: 2, mb: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">
                        Обнаружен риск: {getRuleNameLabel(finding.ruleName, finding.id)}
                      </Typography>
                      <Chip label={`Приоритет: ${getPriorityLabel(finding.priority || '-')}`} size="small" color="warning" />
                      <Chip label={`Создано случаев: ${finding.cases.length}`} size="small" variant="outlined" />
                    </Stack>

                    <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Детали обнаружения
                      </Typography>
                      {Object.keys(finding.details ?? {}).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Нет дополнительных данных
                        </Typography>
                      ) : (
                        <Stack spacing={0.75}>
                          {Object.entries(finding.details ?? {}).map(([key, value]) => (
                            <Box key={key}>
                              <Typography variant="caption" color="text.secondary">
                                {key}
                              </Typography>
                              <Typography variant="body2">{formatUnknown(value)}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </Paper>

                    <Stack spacing={1}>
                      {finding.cases.map((caseItem) => (
                        <Paper key={caseItem.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" fontWeight={600}>
                              Ответственный за случай:{' '}
                              {getAssigneeFullName(caseItem.assignedUserId ?? finding.assignedUserId)}
                            </Typography>
                            <Chip
                              label={getCaseStatusLabelRu(caseItem.status)}
                              size="small"
                              color={getStatusChipColor(caseItem.status)}
                            />
                            <Chip size="small" variant="outlined" label={`ID случая: ${caseItem.id}`} />
                            <Chip label={`Комментариев: ${caseItem.comments.length}`} size="small" variant="outlined" />
                            <Chip label={`Вложений: ${caseItem.attachments.length}`} size="small" variant="outlined" />
                          </Stack>

                          {caseItem.investigation && (
                            <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.paper' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Расследование
                              </Typography>
                              <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Заметки расследования
                                  </Typography>
                                  <Typography variant="body2">
                                    {caseItem.investigation.investigationNotes || '-'}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Первопричина
                                  </Typography>
                                  <Typography variant="body2">{caseItem.investigation.rootCause || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                  <Chip
                                    size="small"
                                    color={caseItem.investigation.requiresCorrectiveAction ? 'warning' : 'default'}
                                    label={
                                      caseItem.investigation.requiresCorrectiveAction
                                        ? 'Требуются корректирующие действия'
                                        : 'Корректирующие действия не требуются'
                                    }
                                  />
                                </Grid>
                              </Grid>
                            </Paper>
                          )}

                          {caseItem.actionPlan && (
                            <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.paper' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                План действий
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                <Chip
                                  size="small"
                                  label={`Задач: ${caseItem.actionPlan.tasks.length}`}
                                  variant="outlined"
                                />
                                <Chip
                                  size="small"
                                  label={
                                    caseItem.actionPlan.verification?.verified
                                      ? 'Верификация: подтверждено'
                                      : 'Верификация: не подтверждено'
                                  }
                                  color={caseItem.actionPlan.verification?.verified ? 'success' : 'default'}
                                />
                              </Stack>
                              <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => openPlanDecisionDialog(caseItem.actionPlan!.id, 'confirm')}
                                >
                                  Подтвердить план
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  onClick={() => openPlanDecisionDialog(caseItem.actionPlan!.id, 'revision')}
                                >
                                  Отклонить на доработку
                                </Button>
                              </Stack>
                              {caseItem.actionPlan.tasks.length > 0 && (
                                <List dense>
                                  {caseItem.actionPlan.tasks.map((task) => (
                                    <ListItem key={task.id} sx={{ px: 0 }}>
                                      <ListItemAvatar>
                                        <Avatar sx={{ width: 28, height: 28 }}>
                                          <TaskIcon fontSize="small" />
                                        </Avatar>
                                      </ListItemAvatar>
                                      <ListItemText
                                        primary={`${task.title} (${task.status})`}
                                        secondary={
                                          <>
                                            <Typography component="span" variant="caption" display="block">
                                              {task.description || 'Без описания'}
                                            </Typography>
                                            <Typography component="span" variant="caption" color="text.secondary">
                                              Срок: {formatDateTime(task.dueDate)} | Приоритет:{' '}
                                              {getPriorityLabel(task.priority)}
                                            </Typography>
                                          </>
                                        }
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              )}
                            </Paper>
                          )}

                          <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.paper' }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Комментарии
                            </Typography>
                            {caseItem.comments.length === 0 ? (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Пока нет комментариев
                              </Typography>
                            ) : (
                              <List dense sx={{ mb: 1 }}>
                                {caseItem.comments.map((comment) => (
                                  <ListItem key={comment.id} sx={{ px: 0 }}>
                                    <ListItemAvatar>
                                      <Avatar sx={{ width: 28, height: 28 }}>
                                        {getCommentAuthorName(comment).charAt(0)}
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={getCommentAuthorName(comment)}
                                      secondary={
                                        <>
                                          <Typography component="span" variant="body2" display="block">
                                            {comment.comment}
                                          </Typography>
                                          <Typography component="span" variant="caption" color="text.secondary">
                                            {formatDateTime(comment.time)}
                                          </Typography>
                                        </>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Оставить комментарий..."
                                value={commentDraftByCase[caseItem.id] ?? ''}
                                onChange={(event) =>
                                  setCommentDraftByCase((prev) => ({ ...prev, [caseItem.id]: event.target.value }))
                                }
                              />
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={
                                  commentSubmittingCaseId === caseItem.id ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <SendIcon />
                                  )
                                }
                                disabled={commentSubmittingCaseId === caseItem.id}
                                onClick={() => void handleAddComment(caseItem.id, selectedIncidentReport.incident.id)}
                              >
                                Отправить
                              </Button>
                            </Stack>
                          </Paper>

                          <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: 'background.paper' }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              flexWrap="wrap"
                              useFlexGap
                              sx={{ mb: 1 }}
                            >
                              <Typography variant="subtitle2">Вложения</Typography>
                              <Button
                                component="label"
                                size="small"
                                variant="outlined"
                                startIcon={
                                  fileUploadingCaseId === caseItem.id ? (
                                    <CircularProgress size={16} color="inherit" />
                                  ) : (
                                    <UploadFileIcon />
                                  )
                                }
                                disabled={fileUploadingCaseId === caseItem.id}
                              >
                                Загрузить файл
                                <input
                                  type="file"
                                  hidden
                                  onChange={(event) => {
                                    const file = event.target.files?.[0] ?? null;
                                    void handleUploadAttachment(caseItem.id, selectedIncidentReport.incident.id, file);
                                    event.target.value = '';
                                  }}
                                />
                              </Button>
                            </Stack>
                            {caseItem.attachments.length === 0 ? (
                              <Typography variant="body2" color="text.secondary">
                                Вложения отсутствуют
                              </Typography>
                            ) : (
                              <List dense>
                                {caseItem.attachments.map((attachment) => (
                                  <ListItem
                                    key={attachment.id}
                                    sx={{ px: 0 }}
                                    secondaryAction={
                                      <IconButton
                                        edge="end"
                                        color="error"
                                        disabled={fileDeletingAttachmentId === attachment.id}
                                        onClick={() =>
                                          void handleDeleteAttachment(
                                            caseItem.id,
                                            attachment.id,
                                            selectedIncidentReport.incident.id
                                          )
                                        }
                                      >
                                        {fileDeletingAttachmentId === attachment.id ? (
                                          <CircularProgress size={18} color="inherit" />
                                        ) : (
                                          <DeleteOutlineIcon />
                                        )}
                                      </IconButton>
                                    }
                                  >
                                    <ListItemAvatar>
                                      <Avatar sx={{ width: 28, height: 28 }}>
                                        <AttachFileIcon fontSize="small" />
                                      </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                      primary={attachment.name}
                                      secondary={
                                        <>
                                          <Typography component="span" variant="caption" display="block">
                                            {getAttachmentAuthorName(attachment)} | {formatFileSize(attachment.size)}
                                          </Typography>
                                          <Typography component="span" variant="caption" color="text.secondary">
                                            {formatDateTime(attachment.time)}
                                          </Typography>
                                        </>
                                      }
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            )}
                          </Paper>
                        </Paper>
                      ))}
                    </Stack>
                  </Paper>
                ))}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSelectedIncidentReport(null)}>Закрыть</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        <Dialog open={planDecisionDialogOpen} onClose={() => setPlanDecisionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {planDecisionType === 'confirm' ? 'Подтверждение плана действий' : 'Отклонение плана на доработку'}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {planDecisionType === 'confirm'
                ? 'Добавьте комментарий к подтверждению плана.'
                : 'Укажите комментарий, что нужно доработать в плане.'}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Комментарий"
              value={planDecisionComment}
              onChange={(event) => setPlanDecisionComment(event.target.value)}
              placeholder="Введите комментарий..."
            />
            {planDecisionError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {planDecisionError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPlanDecisionDialogOpen(false)} disabled={planDecisionSubmitting}>
              Отмена
            </Button>
            <Button
              variant="contained"
              color={planDecisionType === 'confirm' ? 'success' : 'warning'}
              onClick={handleSubmitPlanDecision}
              disabled={planDecisionSubmitting}
              startIcon={planDecisionSubmitting ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {planDecisionType === 'confirm' ? 'Подтвердить' : 'Отправить на доработку'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
});
