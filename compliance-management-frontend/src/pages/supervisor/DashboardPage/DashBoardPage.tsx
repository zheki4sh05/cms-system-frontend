// src/pages/supervisor/DashboardPage/DashboardPage.tsx

import { type FC, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  LinearProgress,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Badge,
  Stack,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Error as ErrorIcon,
  Star as StarIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  ThumbUp as ApproveIcon,
  ThumbDown as RejectIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Domain as DomainIcon,
  Insights as InsightsIcon,
  LocalFireDepartment as HotspotIcon,
  Assignment as CasesIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useAuthStore } from '@features/auth/useAuthStore';
import { SupervisorApi } from '@shared/lib/api/supervisorApi';
import { downloadSupervisorDashboardPdf } from '@shared/lib/pdf/supervisorDashboardPdf';
import {
  IncidentStatus,
  type IncidentProblemAreaGroup,
  type IncidentProblemAreasResponse,
  type IncidentReportItem,
  type IncidentsOverviewResponse,
  type IncidentsOverviewScope,
  type IncidentWorkflowStatusOverview,
} from '@shared/types/incidentTypes';
import type {
  SupervisorDashboardStats,
  TeamKPI,
  PendingVerificationItem,
  VerificationResponsible,
  RuleEffectiveness,
} from '@shared/types/supervisorTypes';

const verificationListTitle = (item: PendingVerificationItem) =>
  item.documentTitle?.trim() || 'Документ без названия';

const responsibleFullName = (r: VerificationResponsible) => {
  const parts = [r.firstName, r.lastName].filter(Boolean);
  if (parts.length) return parts.join(' ');
  if (r.userId) return `Пользователь ${r.userId}`;
  if (r.employeeId) return `Сотрудник ${r.employeeId}`;
  return 'Не указано';
};

const formatVerificationInstant = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString('ru-RU');
};

const labelFromUnknown = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
};

const formatProblemAreasMonthUtc = (ym: string) => {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '—';
  const [y, mo] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, mo - 1, 1));
  return d.toLocaleString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const groupRiskTitle = (group: IncidentProblemAreaGroup) => {
  const name = labelFromUnknown(group.incidents[0]?.incident?.riskObjectName);
  return name || `Номер объекта наблюдения: ${group.documentId}`;
};

const incidentRuleNames = (item: IncidentReportItem): string[] => {
  const names: string[] = [];
  for (const f of item.findings) {
    const rn = labelFromUnknown(f.ruleName);
    if (rn) names.push(rn);
  }
  return [...new Set(names)];
};

const countCasesInProblemGroup = (group: IncidentProblemAreaGroup): number =>
  group.incidents.reduce(
    (sum, rep) => sum + rep.findings.reduce((s, f) => s + f.cases.length, 0),
    0
  );

/** Нагрузка по числу связанных инцидентов в кластере */
const groupIncidentHeat = (group: IncidentProblemAreaGroup): 'CRITICAL' | 'HIGH' | 'MEDIUM' => {
  if (group.incidentCount >= 5) return 'CRITICAL';
  if (group.incidentCount >= 3) return 'HIGH';
  return 'MEDIUM';
};

const OVERVIEW_SCOPE_LABEL: Record<IncidentsOverviewScope, string> = {
  COMPANY: 'Вся компания (полный охват)',
  DEPARTMENT: 'Подчинённые отдела',
};

/** Краткая подпись для Chip в шапке обзора */
const OVERVIEW_SCOPE_CHIP: Record<IncidentsOverviewScope, string> = {
  COMPANY: 'Компания',
  DEPARTMENT: 'Отдел',
};

/** Нагрузка кластера (не путать с серьёзностью объекта риска) */
const CLUSTER_HEAT_RU: Record<'CRITICAL' | 'HIGH' | 'MEDIUM', string> = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
};

const RISK_SEVERITY_MONITORING_RU = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  unknown: 'Неизвестно',
} as const;

/** Подписи статусов workflow для агрегатов диаграммы */
const OVERVIEW_INCIDENT_TITLE_RU: Record<IncidentWorkflowStatusOverview, string> = {
  OPEN: 'Открыты',
  PARTLY_PROGRESS: 'Частично в работе',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решены',
};

const OVERVIEW_INCIDENT_ORDER: IncidentWorkflowStatusOverview[] = [
  'OPEN',
  'PARTLY_PROGRESS',
  'IN_PROGRESS',
  'RESOLVED',
];

/** Те же статусы для одной записи инцидента (Chip / диалог) */
const INCIDENT_WORKFLOW_STATUS_RU: Record<IncidentWorkflowStatusOverview, string> = {
  OPEN: 'Открыт',
  PARTLY_PROGRESS: 'Частично в работе',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решён',
};

const INCIDENT_STATUS_RU: Record<IncidentStatus, string> = {
  [IncidentStatus.NEW]: 'Новый',
  [IncidentStatus.ASSIGNED]: 'Назначен',
  [IncidentStatus.PARTLY_PROGRESS]: 'Частично в работе',
  [IncidentStatus.IN_REVIEW]: 'На проверке',
  [IncidentStatus.RESOLVED]: 'Решён',
  [IncidentStatus.FALSE_POSITIVE]: 'Ложное срабатывание',
  [IncidentStatus.ESCALATED_TO_CASE]: 'Передан в кейс',
};

function incidentStatusRu(status: string): string {
  const wf = INCIDENT_WORKFLOW_STATUS_RU[status as IncidentWorkflowStatusOverview];
  if (wf) return wf;
  return INCIDENT_STATUS_RU[status as IncidentStatus] ?? status;
}

/** Процент по доле, без NaN */
const safePct = (value: number, total: number) =>
  total > 0 ? Math.round((Math.max(0, value) / total) * 1000) / 10 : 0;

export const SupervisorDashboardPage: FC = observer(() => {
  const authStore = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupervisorDashboardStats | null>(null);
  const [teamKPI, setTeamKPI] = useState<TeamKPI[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<PendingVerificationItem[]>([]);
  const [problemAreasData, setProblemAreasData] = useState<IncidentProblemAreasResponse | null>(
    null
  );
  const [ruleEffectiveness, setRuleEffectiveness] = useState<RuleEffectiveness[]>([]);
  const [incidentsOverview, setIncidentsOverview] = useState<IncidentsOverviewResponse | null>(
    null
  );
  
  // Диалоги
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<PendingVerificationItem | null>(null);
  const [verificationComments, setVerificationComments] = useState('');
  
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [selectedProblemGroup, setSelectedProblemGroup] = useState<IncidentProblemAreaGroup | null>(
    null
  );

  const problemGroups = problemAreasData?.groups ?? [];

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const statsData = await SupervisorApi.getDashboardStats();
      setStats(statsData);

      const settled = await Promise.allSettled([
        SupervisorApi.getTeamKPI(),
        SupervisorApi.getVerificationQueue(),
        SupervisorApi.getProblemAreas(),
        SupervisorApi.getRuleEffectiveness(),
        SupervisorApi.getIncidentsOverview(),
      ]);

      if (settled[0].status === 'fulfilled') setTeamKPI(settled[0].value);
      else console.error('Failed to load team KPI:', settled[0].reason);

      if (settled[1].status === 'fulfilled') setVerificationQueue(settled[1].value);
      else console.error('Failed to load verification queue:', settled[1].reason);

      if (settled[2].status === 'fulfilled') setProblemAreasData(settled[2].value);
      else {
        console.error('Failed to load problem areas:', settled[2].reason);
        setProblemAreasData(null);
      }

      if (settled[3].status === 'fulfilled') setRuleEffectiveness(settled[3].value);
      else console.error('Failed to load rule effectiveness:', settled[3].reason);

      if (settled[4].status === 'fulfilled') setIncidentsOverview(settled[4].value);
      else {
        console.error('Failed to load incidents overview:', settled[4].reason);
        setIncidentsOverview(null);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerification = (item: PendingVerificationItem) => {
    setSelectedVerification(item);
    setVerificationDialogOpen(true);
  };

  const handleProcessVerification = async (approved: boolean) => {
    if (!selectedVerification) return;
    
    try {
      await SupervisorApi.processVerification(selectedVerification.actionPlanId, {
        approved,
        comments: verificationComments,
      });
      
      await loadDashboardData();
      setVerificationDialogOpen(false);
      setSelectedVerification(null);
      setVerificationComments('');
    } catch (error) {
      console.error('Failed to process verification:', error);
    }
  };

  const handleExportPdfReport = async () => {
    try {
      const u = authStore.user;
      const userDisplayName =
        u && (u.firstName || u.lastName)
          ? [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
          : undefined;
      const departmentLine =
        u?.departmentName ??
        (u?.departmentId ? `Отдел (идентификатор ${u.departmentId})` : undefined);

      await downloadSupervisorDashboardPdf({
        generatedAt: new Date(),
        userDisplayName,
        departmentLine,
        stats,
        teamKPI,
        verificationQueue,
        problemAreasData,
        incidentsOverview,
        ruleEffectiveness,
      });
    } catch (error) {
      console.error('Failed to export dashboard PDF:', error);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUpIcon color="error" fontSize="small" />;
    if (trend < 0) return <TrendingDownIcon color="success" fontSize="small" />;
    return <TrendingFlatIcon color="disabled" fontSize="small" />;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'info';
    if (score >= 60) return 'warning';
    return 'error';
  };

  /** Лучшие показатели выше: сначала «в срок», затем меньше среднее время решения */
  const sortedTeamKPI = useMemo(() => {
    return [...teamKPI].sort((a, b) => {
      if (b.onTimeCompletion !== a.onTimeCompletion) {
        return b.onTimeCompletion - a.onTimeCompletion;
      }
      return a.avgResolutionTime - b.avgResolutionTime;
    });
  }, [teamKPI]);

  const overviewStatusTotal = useMemo(() => {
    if (!incidentsOverview) return 0;
    return OVERVIEW_INCIDENT_ORDER.reduce(
      (s, k) => s + (incidentsOverview.incidents.byStatus[k] ?? 0),
      0
    );
  }, [incidentsOverview]);

  const overviewSeverityTotal = useMemo(() => {
    if (!incidentsOverview) return 0;
    const d = incidentsOverview.incidentsByRiskObjectSeverity;
    return d.low + d.medium + d.high + d.unknown;
  }, [incidentsOverview]);

  const overviewHotspotMax = useMemo(() => {
    if (!incidentsOverview?.riskHotspots.length) return 0;
    return Math.max(...incidentsOverview.riskHotspots.map((h) => h.incidentCount), 1);
  }, [incidentsOverview]);

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
          <Box>
            <Typography variant="h4" gutterBottom>
              Панель руководителя
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Стратегический обзор системы контроля и команды
            </Typography>
            {(authStore.user?.departmentName || authStore.user?.departmentId) && (
              <Paper
                elevation={0}
                sx={(theme) => ({
                  mt: 2.5,
                  maxWidth: 520,
                  py: 1.75,
                  px: 2.25,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.07),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.22),
                  boxShadow: `0 4px 18px ${alpha(theme.palette.primary.main, 0.1)}`,
                })}
              >
                <Avatar
                  sx={(theme) => ({
                    width: 44,
                    height: 44,
                    bgcolor: theme.palette.primary.main,
                    boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.45)}`,
                  })}
                >
                  <DomainIcon />
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="overline"
                    sx={{
                      display: 'block',
                      lineHeight: 1.2,
                      letterSpacing: 1.2,
                      fontWeight: 700,
                      color: 'primary.main',
                    }}
                  >
                    Ваше подразделение
                  </Typography>
                  <Typography
                    variant="h6"
                    component="p"
                    sx={{
                      mt: 0.25,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      wordBreak: 'break-word',
                    }}
                  >
                    {authStore.user?.departmentName ??
                      (authStore.user?.departmentId
                        ? `Отдел (идентификатор ${authStore.user.departmentId})`
                        : '')}
                  </Typography>
                </Box>
              </Paper>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportPdfReport()}
            >
              Экспорт PDF
            </Button>
          </Box>
        </Box>

        {/* Критичные метрики - верхняя панель */}
        {stats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid  size={{xs:12, md:3}}>
              <Card sx={{ height: '100%', bgcolor: 'error.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="error.main">
                        {stats.criticalIncidents}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Критичные инциденты
                      </Typography>
                    </Box>
                    <WarningIcon sx={{ fontSize: 48, color: 'error.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid  size={{xs:12, md:3}}>
              <Card sx={{ height: '100%', bgcolor: 'warning.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="warning.main">
                        {stats.overdueActionPlans}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Просроченные планы
                      </Typography>
                    </Box>
                    <ScheduleIcon sx={{ fontSize: 48, color: 'warning.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid  size={{xs:12, md:3}}>
              <Card sx={{ height: '100%', bgcolor: 'info.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="info.main">
                        {stats.pendingVerifications}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ожидают проверки
                      </Typography>
                    </Box>
                    <AssessmentIcon sx={{ fontSize: 48, color: 'info.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid  size={{xs:12, md:3}}>
              <Card sx={{ height: '100%', bgcolor: 'success.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {stats.avgResolutionTime}ч
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Ср. время решения
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        {getTrendIcon(stats.resolutionTimeTrend)}
                        <Typography variant="caption" sx={{ ml: 0.5 }}>
                          {Math.abs(stats.resolutionTimeTrend)}% за месяц
                        </Typography>
                      </Box>
                    </Box>
                    <SpeedIcon sx={{ fontSize: 48, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {incidentsOverview && (
          <Card sx={{ mb: 3 }}>
            <CardHeader
              avatar={<InsightsIcon color="primary" />}
              title="Обзор инцидентов"
              subheader={`${OVERVIEW_SCOPE_LABEL[incidentsOverview.scope]} • GET /api/incidents/overview`}
              action={
                <Chip
                  label={OVERVIEW_SCOPE_CHIP[incidentsOverview.scope]}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              }
            />
            <Divider />
            <CardContent>
              {incidentsOverview.incidents.staleUnresolved > 0 && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <strong>Стейл без решения (&gt; 14 сут.): </strong>
                  {incidentsOverview.incidents.staleUnresolved} — не в статусе «Решены», минимальная дата по
                  обнаружениям дольше порога.
                </Alert>
              )}

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Инциденты по статусам
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                    {OVERVIEW_INCIDENT_ORDER.map((k) => OVERVIEW_INCIDENT_TITLE_RU[k]).join(' • ')}. В сумме по
                    блоку: <strong>{overviewStatusTotal}</strong>.
                  </Typography>
                  <Stack spacing={1.25}>
                    {OVERVIEW_INCIDENT_ORDER.map((key) => {
                      const cnt = incidentsOverview.incidents.byStatus[key] ?? 0;
                      const pct = safePct(cnt, overviewStatusTotal);
                      return (
                        <Box key={key}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'baseline',
                              mb: 0.35,
                              gap: 1,
                            }}
                          >
                            <Typography variant="body2">{OVERVIEW_INCIDENT_TITLE_RU[key]}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cnt} ({pct}%)
                            </Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={pct} sx={{ height: 10, borderRadius: 1 }} />
                        </Box>
                      );
                    })}
                  </Stack>

                  <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                    Связь с номером объекта наблюдения
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    С номером объекта наблюдения vs без ({incidentsOverview.incidents.withDocumentId} /{' '}
                    {incidentsOverview.incidents.withoutDocumentId}).
                  </Typography>
                  {(() => {
                    const wd = incidentsOverview.incidents.withDocumentId;
                    const wo = incidentsOverview.incidents.withoutDocumentId;
                    const dsum = wd + wo;
                    return (
                      <>
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 0.75, height: 14, borderRadius: 1, overflow: 'hidden' }}>
                          {dsum > 0 ? (
                            <>
                              <Tooltip title={`С номером объекта наблюдения: ${wd}`}>
                                <Box
                                  sx={{
                                    width: `${safePct(wd, dsum)}%`,
                                    minWidth: wd > 0 ? 8 : 0,
                                    bgcolor: 'primary.main',
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title={`Без номера объекта наблюдения: ${wo}`}>
                                <Box
                                  sx={{
                                    width: `${safePct(wo, dsum)}%`,
                                    minWidth: wo > 0 ? 8 : 0,
                                    bgcolor: 'action.selected',
                                  }}
                                />
                              </Tooltip>
                            </>
                          ) : (
                            <Box sx={{ flex: 1, bgcolor: 'action.hover' }} />
                          )}
                        </Box>
                      </>
                    );
                  })()}
                </Grid>

                <Grid size={{ xs: 12, lg: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Обнаружения
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Всего: <strong>{incidentsOverview.findings.total}</strong> • Без назначенного пользователя:{' '}
                    <strong>{incidentsOverview.findings.withoutAssignedUser}</strong>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={safePct(
                      incidentsOverview.findings.withoutAssignedUser,
                      incidentsOverview.findings.total
                    )}
                    color="warning"
                    sx={{ height: 12, borderRadius: 1, mb: 3 }}
                  />

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CasesIcon color="secondary" />
                    <Typography variant="subtitle2">Кейсы</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Ожидание верификации • Закрыты • Прочие (итого{' '}
                    <strong>{incidentsOverview.cases.total}</strong>).
                  </Typography>
                  <Box sx={{ display: 'flex', height: 16, borderRadius: 1, overflow: 'hidden', mb: 1 }}>
                    {(() => {
                      const cv = incidentsOverview.cases.total;
                      if (cv <= 0)
                        return <Box sx={{ flex: 1, bgcolor: 'action.hover' }} />;

                      const wvPct = safePct(incidentsOverview.cases.waitingVerification, cv);
                      const closedPct = safePct(incidentsOverview.cases.closed, cv);
                      const otherPct = safePct(incidentsOverview.cases.other, cv);

                      const parts = [
                        {
                          pct: closedPct,
                          color: 'success.main',
                          label: `Закрыты: ${incidentsOverview.cases.closed}`,
                        },
                        {
                          pct: wvPct,
                          color: 'warning.main',
                          label: `Ожидают верификацию: ${incidentsOverview.cases.waitingVerification}`,
                        },
                        {
                          pct: otherPct,
                          color: 'info.main',
                          label: `Прочие: ${incidentsOverview.cases.other}`,
                        },
                      ];
                      return parts.map((p, i) => (
                        <Tooltip key={`${p.label}-${i}`} title={p.label}>
                          <Box
                            sx={{
                              width: `${p.pct}%`,
                              minWidth: p.pct > 0 ? 6 : 0,
                              bgcolor: p.color,
                            }}
                          />
                        </Tooltip>
                      ));
                    })()}
                  </Box>
                  <Typography variant="body2">
                    Планы действий с <strong>просроченными</strong> незакрытыми задачами:{' '}
                    <Chip
                      label={incidentsOverview.actionPlans.withOverdueTasks}
                      size="small"
                      color={
                        incidentsOverview.actionPlans.withOverdueTasks > 0 ? 'error' : 'default'
                      }
                    />
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <HotspotIcon color="error" />
                    <Typography variant="subtitle2">
                      Объекты риска (до 5, по числу инцидентов)
                    </Typography>
                  </Box>
                  {incidentsOverview.riskHotspots.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Нет данных по точкам риска.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {incidentsOverview.riskHotspots.map((h) => (
                        <Box key={h.riskObjectId}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 1,
                              alignItems: 'baseline',
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {labelFromUnknown(h.name) || h.riskObjectId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                              {h.incidentCount} инц.
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={safePct(h.incidentCount, overviewHotspotMax)}
                            sx={{ height: 8, borderRadius: 1 }}
                            color="error"
                          />
                          <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                            {h.riskObjectId}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Серьёзность объекта риска (мониторинг)
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    Распределение инцидентов по уровню серьёзности объекта риска (низкий / средний / высокий /
                    неизвестно) • всего записей для диаграммы: <strong>{overviewSeverityTotal}</strong>
                  </Typography>
                  <Stack spacing={1.25}>
                    {(
                      [
                        { key: 'low' as const, label: RISK_SEVERITY_MONITORING_RU.low, color: 'success' as const },
                        { key: 'medium' as const, label: RISK_SEVERITY_MONITORING_RU.medium, color: 'info' as const },
                        { key: 'high' as const, label: RISK_SEVERITY_MONITORING_RU.high, color: 'warning' as const },
                        {
                          key: 'unknown' as const,
                          label: RISK_SEVERITY_MONITORING_RU.unknown,
                          color: 'inherit' as const,
                        },
                      ] as const
                    ).map((row) => {
                      const cnt = incidentsOverview.incidentsByRiskObjectSeverity[row.key];
                      const pct = safePct(cnt, overviewSeverityTotal);
                      return (
                        <Box key={row.key}>
                          <Box
                            sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35, gap: 1 }}
                          >
                            <Typography variant="body2">{row.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {cnt} ({pct}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={pct}
                            sx={{ height: 10, borderRadius: 1 }}
                            color={row.color}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Основной контент - 3 колонки */}
        <Grid container spacing={3}>
          {/* Левая колонка - KPI команды */}
          <Grid size={{xs:12, lg:4}}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="KPI команды"
                avatar={<PeopleIcon color="primary" />}
                action={
                  <Chip label={`${teamKPI.length} менеджеров`} size="small" />
                }
              />
              <Divider />
              <CardContent sx={{ maxHeight: 600, overflow: 'auto' }}>
                {sortedTeamKPI.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PeopleIcon sx={{ fontSize: 40, color: 'action.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Нет данных по KPI менеджеров
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {sortedTeamKPI.map((member, index) => (
                      <Box key={member.managerId}>
                        <ListItem sx={{ px: 0 }} alignItems="flex-start">
                          <ListItemAvatar sx={{ minWidth: 56 }}>
                            <Avatar>{member.managerName.charAt(0)}</Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" fontWeight="medium">
                                  {member.managerName}
                                </Typography>
                                {index === 0 && (
                                  <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box component="span" sx={{ display: 'block' }}>
                                <Typography variant="caption" display="block" component="span">
                                  Инциденты: решено {member.resolvedIncidents} из {member.assignedIncidents}{' '}
                                  назначенных • Случаи: активных {member.activeCases}, закрытых{' '}
                                  {member.completedCases}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                                  <Chip
                                    label={`Планы в срок: ${member.onTimeCompletion}%`}
                                    size="small"
                                    color={getPerformanceColor(member.onTimeCompletion)}
                                  />
                                  <Typography variant="caption" color="text.secondary" component="span">
                                    Ср. время решения: {member.avgResolutionTime} ч
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min(100, Math.max(0, member.onTimeCompletion))}
                                  color={getPerformanceColor(member.onTimeCompletion)}
                                  sx={{ mt: 1, height: 6, borderRadius: 1 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < sortedTeamKPI.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Средняя колонка - Очередь верификации */}
          <Grid size={{xs:12, lg:4}}>
            <Stack spacing={3}>
              {/* Очередь верификации */}
              <Card>
                <CardHeader
                  title="Очередь верификации"
                  avatar={<AssessmentIcon color="warning" />}
                  action={
                    <Badge badgeContent={verificationQueue.length} color="error">
                      <Chip label="Требует внимания" size="small" color="warning" />
                    </Badge>
                  }
                />
                <Divider />
                <CardContent sx={{ maxHeight: 400, overflow: 'auto' }}>
                  {verificationQueue.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Очередь пуста
                      </Typography>
                    </Box>
                  ) : (
                    <List sx={{ p: 0 }}>
                      {verificationQueue.map((item, index) => (
                        <Box key={item.actionPlanId}>
                          <ListItem
                            sx={{
                              px: 0,
                              cursor: 'pointer',
                              alignItems: 'flex-start',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => handleOpenVerification(item)}
                          >
                            <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                              <AssessmentIcon color="primary" />
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {verificationListTitle(item)}
                                  </Typography>
                                  <Chip label="План действий" size="small" color="primary" variant="outlined" />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography variant="caption" display="block">
                                    Ответственный: {responsibleFullName(item.responsible)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Инцидент: {item.incidentId} • План: {item.actionPlanId}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Поступление инцидента: {formatVerificationInstant(item.incidentReceivedAt)}
                                  </Typography>
                                </>
                              }
                            />
                            <IconButton size="small" color="primary" aria-label="Открыть предпросмотр">
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </ListItem>
                          {index < verificationQueue.length - 1 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Stack>
          </Grid>

          {/* Правая колонка - Проблемные зоны */}
          <Grid size={{xs:12, lg:4}}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Проблемные зоны"
                avatar={<ErrorIcon color="error" />}
                subheader={
                  problemAreasData?.month
                    ? `Месяц применения (UTC): ${problemAreasData.month} (${formatProblemAreasMonthUtc(
                        problemAreasData.month
                      )}). Повторные срабатывания по одному номеру объекта наблюдения.`
                    : undefined
                }
                action={
                  problemGroups.length > 0 ? (
                    <Chip
                      label={`${problemGroups.length} групп`}
                      size="small"
                      color="warning"
                      variant="outlined"
                    />
                  ) : undefined
                }
              />
              <Divider />
              <CardContent sx={{ maxHeight: 600, overflow: 'auto' }}>
                {problemGroups.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      За месяц нет номеров объекта наблюдения с более чем одним связанным инцидентом по правилам API
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {problemGroups.map((group) => {
                      const heat = groupIncidentHeat(group);
                      const allRules = Array.from(
                        new Set(group.incidents.flatMap((rep) => incidentRuleNames(rep)))
                      );
                      const rulesPreview = allRules.slice(0, 3);
                      const casesTotal = countCasesInProblemGroup(group);

                      return (
                      <Card
                        key={group.documentId}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 },
                          borderLeft: 4,
                          borderLeftColor: `${getSeverityColor(heat)}.main`,
                        }}
                        onClick={() => {
                          setSelectedProblemGroup(group);
                          setProblemDialogOpen(true);
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {groupRiskTitle(group)}
                            </Typography>
                            <Chip label={CLUSTER_HEAT_RU[heat]} size="small" color={getSeverityColor(heat)} />
                          </Box>

                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            Номер объекта наблюдения: {group.documentId}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {rulesPreview.length > 0
                              ? `Правила (фрагмент): ${rulesPreview.join(', ')}${allRules.length > rulesPreview.length ? '…' : ''}`
                              : 'Правила указаны в обнаружениях инцидентов (отчёт).'}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                            <Tooltip title="Число инцидентов по этому номеру объекта наблюдения в месяце (из ответа API)">
                              <Chip
                                label={`Инцидентов: ${group.incidentCount}`}
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                            <Tooltip title="Сумма кейсов по обнаружениям в приложенных отчётах">
                              <Chip label={`Кейсов: ${casesTotal}`} size="small" variant="outlined" />
                            </Tooltip>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Выберите, чтобы открыть отчёты по связанным инцидентам.
                          </Typography>
                        </CardContent>
                      </Card>
                      );
                    })}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Нижняя секция — эффективность правил */}
        <Grid container spacing={3} sx={{ mt: 0 }}>
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardHeader
                title="Эффективность правил"
                avatar={<ShieldIcon color="primary" />}
                subheader="Анализ точности срабатывания правил"
              />
              <Divider />
              <CardContent>
                {ruleEffectiveness.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Нет данных по правилам для отображения.
                  </Typography>
                ) : (
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Правило</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell align="center">Отклонено (REJECTED)</TableCell>
                        <TableCell align="center">Закрыто (CLOSED)</TableCell>
                        <TableCell align="center">Всего кейсов</TableCell>
                        <TableCell>Правило в CMS</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ruleEffectiveness.map((rule) => {
                        const name = rule.ruleName.trim();
                        const catLabel = rule.categoryName.trim() || rule.categoryId || '—';
                        const totalCases = rule.rejectedCount + rule.closedCount;
                        return (
                        <TableRow key={rule.ruleId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {name || '—'}
                            </Typography>
                            {!name && (
                              <Typography variant="caption" color="text.secondary" display="block" fontFamily="monospace">
                                {rule.ruleId}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {rule.categoryId ? (
                              <Tooltip title={`Идентификатор категории: ${rule.categoryId}`}>
                                <Chip label={catLabel} size="small" variant="outlined" />
                              </Tooltip>
                            ) : (
                              <Chip label={catLabel} size="small" variant="outlined" />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{rule.rejectedCount}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{rule.closedCount}</Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{totalCases}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rule.ruleActive ? 'Активно' : 'Неактивно'}
                              size="small"
                              color={rule.ruleActive ? 'success' : 'default'}
                            />
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Диалог верификации */}
        <Dialog
          open={verificationDialogOpen}
          onClose={() => setVerificationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedVerification && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6">Верификация плана действий</Typography>
                  <Chip label="План действий" color="primary" />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" display="block" gutterBottom>
                    <strong>План действий:</strong> {selectedVerification.actionPlanId}
                  </Typography>
                  <Typography variant="body2" display="block" gutterBottom>
                    <strong>Инцидент:</strong> {selectedVerification.incidentId}
                  </Typography>
                  <Typography variant="body2" display="block" gutterBottom>
                    <strong>Поступление инцидента (раннее обнаружение):</strong>{' '}
                    {formatVerificationInstant(selectedVerification.incidentReceivedAt)}
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Название документа
                </Typography>
                <Typography variant="h6" gutterBottom sx={{ wordBreak: 'break-word' }}>
                  {verificationListTitle(selectedVerification)}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }} gutterBottom>
                  Ответственный по делу
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>ФИО:</strong> {responsibleFullName(selectedVerification.responsible)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <strong>userId:</strong> {selectedVerification.responsible.userId ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>employeeId:</strong> {selectedVerification.responsible.employeeId ?? '—'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Имя / фамилия:</strong>{' '}
                    {[selectedVerification.responsible.firstName, selectedVerification.responsible.lastName]
                      .filter(Boolean)
                      .join(' ') || '—'}
                  </Typography>
                </Paper>

                <TextField
                  fullWidth
                  label="Комментарии"
                  multiline
                  rows={4}
                  value={verificationComments}
                  onChange={(e) => setVerificationComments(e.target.value)}
                  placeholder="Добавьте комментарии к решению..."
                  sx={{ mt: 3 }}
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setVerificationDialogOpen(false)}>
                  Отмена
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<RejectIcon />}
                  onClick={() => handleProcessVerification(false)}
                >
                  Отклонить
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<ApproveIcon />}
                  onClick={() => handleProcessVerification(true)}
                >
                  Утвердить
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог проблемной зоны */}
        <Dialog
          open={problemDialogOpen}
          onClose={() => setProblemDialogOpen(false)}
          maxWidth="md"
          fullWidth
          scroll="paper"
        >
          {selectedProblemGroup && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h6">{groupRiskTitle(selectedProblemGroup)}</Typography>
                  <Chip
                    label={CLUSTER_HEAT_RU[groupIncidentHeat(selectedProblemGroup)]}
                    color={getSeverityColor(groupIncidentHeat(selectedProblemGroup))}
                  />
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>{formatProblemAreasMonthUtc(problemAreasData?.month ?? '')}</strong> (
                    <code>{problemAreasData?.month ?? '—'}</code>): один <strong>номер объекта наблюдения</strong> —{' '}
                    <strong>{selectedProblemGroup.incidentCount}</strong> связанных инцидентов в месяце.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Номер объекта наблюдения: <strong>{selectedProblemGroup.documentId}</strong>
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                  Инциденты (полные элементы отчёта из API)
                </Typography>

                <Stack spacing={2}>
                  {selectedProblemGroup.incidents.map((rep) => {
                    const rules = incidentRuleNames(rep);
                    const casesTotal = rep.findings.reduce((s, f) => s + f.cases.length, 0);

                    return (
                      <Paper key={rep.incident.id} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Инцидент{' '}
                          <Typography component="span" variant="subtitle2" fontFamily="monospace">
                            {rep.incident.id}
                          </Typography>
                          <Chip
                            label={incidentStatusRu(rep.incident.status)}
                            size="small"
                            sx={{ ml: 1 }}
                            variant="outlined"
                          />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Объект риска:{' '}
                          <strong>{labelFromUnknown(rep.incident.riskObjectName) || '—'}</strong> • Интеграция:{' '}
                          {labelFromUnknown(rep.incident.integrationName) || String(rep.incident.integrationId)}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                          riskObjectId:{' '}
                          <Typography component="span" variant="caption" fontFamily="monospace">
                            {rep.incident.riskObjectId || '—'}
                          </Typography>
                          {' • '}
                          Обнаружений: <strong>{rep.findings.length}</strong>, кейсов суммарно:{' '}
                          <strong>{casesTotal}</strong>
                        </Typography>
                        {rules.length > 0 ? (
                          <Typography variant="body2">
                            Правила:{' '}
                            {[...new Set(rules)].join(', ')}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            У обнаружений может не быть ruleName — см. данные массива обнаружений.
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setProblemDialogOpen(false)}>
                  Закрыть
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
});
