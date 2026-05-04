import { type FC, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Alert,
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
  LinearProgress,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  FolderOpen as CaseIcon,
  OpenInNew as OpenInNewIcon,
  ReportProblem as IncidentIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { IncidentApi } from '@shared/lib/api/incidentApi';
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

const getIncidentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    NEW: 'Новый',
    OPEN: 'Открыт',
    ASSIGNED: 'Назначен',
    PARTLY_PROGRESS: 'Частичный прогресс',
    IN_PROGRESS: 'В процессе',
    IN_REVIEW: 'На проверке',
    RESOLVED: 'Решен',
    FALSE_POSITIVE: 'Ложное срабатывание',
    ESCALATED_TO_CASE: 'Эскалирован в случай',
  };
  const normalized = status.toUpperCase();
  return labels[normalized] ?? status;
};

const getCaseStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    WAITING_VERIFICATION: 'На проверке',
  };
  const normalized = status.toUpperCase();
  return labels[normalized] ?? status;
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

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await IncidentApi.getIncidentReports(page, rowsPerPage);
        setData(response);
      } catch (loadError) {
        console.error('Failed to load incidents report:', loadError);
        setError('Не удалось загрузить отчет по инцидентам и случаям.');
      } finally {
        setLoading(false);
      }
    };

    void loadReports();
  }, [page, rowsPerPage]);

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
                      label={getIncidentStatusLabel(item.incident.status)}
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
                                  label={getCaseStatusLabel(caseItem.status)}
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
                    label={getIncidentStatusLabel(selectedIncidentReport.incident.status)}
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
                        Обнаружение: {getRuleNameLabel(finding.ruleName, finding.id)}
                      </Typography>
                      <Chip label={`Приоритет: ${getPriorityLabel(finding.priority || '-')}`} size="small" color="warning" />
                      <Chip label={`Cases: ${finding.cases.length}`} size="small" variant="outlined" />
                    </Stack>

                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      details: {JSON.stringify(finding.details ?? {}, null, 2)}
                    </Typography>

                    <Stack spacing={1}>
                      {finding.cases.map((caseItem) => (
                        <Paper key={caseItem.id} variant="outlined" sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                            <Typography variant="body2" fontWeight={600}>
                              Ответственный за случай:{' '}
                              {getAssigneeFullName(caseItem.assignedUserId ?? finding.assignedUserId)}
                            </Typography>
                            <Chip
                              label={getCaseStatusLabel(caseItem.status)}
                              size="small"
                              color={getStatusChipColor(caseItem.status)}
                            />
                            <Chip size="small" variant="outlined" label={`ID случая: ${caseItem.id}`} />
                            <Chip label={`comments: ${caseItem.comments.length}`} size="small" variant="outlined" />
                            <Chip
                              label={`attachments: ${caseItem.attachments.length}`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>

                          {caseItem.investigation && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Investigation:
                              </Typography>
                              <Typography variant="body2">
                                Notes: {caseItem.investigation.investigationNotes || '-'}
                              </Typography>
                              <Typography variant="body2">
                                Root cause: {caseItem.investigation.rootCause || '-'}
                              </Typography>
                              <Typography variant="body2">
                                Requires corrective action:{' '}
                                {caseItem.investigation.requiresCorrectiveAction ? 'Да' : 'Нет'}
                              </Typography>
                            </Box>
                          )}

                          {caseItem.actionPlan && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Action plan:
                              </Typography>
                              <Typography variant="body2">
                                Tasks: {caseItem.actionPlan.tasks.length}
                              </Typography>
                              <Typography variant="body2">
                                Verified: {caseItem.actionPlan.verification?.verified ? 'Да' : 'Нет'}
                              </Typography>
                            </Box>
                          )}
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
      </Box>
    </Container>
  );
});
