// Стратегическая панель (топ-менеджер): stats, overview, problem-areas, verification queue, rule-effectiveness, KPI

import { type FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  Insights as InsightsIcon,
  Shield as ShieldIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { IncidentApi } from '@shared/lib/api/incidentApi';
import { SupervisorApi } from '@shared/lib/api/supervisorApi';
import type {
  IncidentProblemAreaGroup,
  IncidentProblemAreasResponse,
  IncidentReportItem,
  IncidentStatistics,
  IncidentsOverviewResponse,
  IncidentWorkflowStatusOverview,
} from '@shared/types/incidentTypes';
import type { PendingVerificationItem, RuleEffectiveness, TeamKPI } from '@shared/types/supervisorTypes';

/** Подсказки к полям GET /api/incidents/my/stats для топ-менеджера (EXECUTIVE) */
const INCIDENT_COMPANY_STATS_HINT = {
  totalIncidents: 'Число инцидентов компании в выборке.',
  totalFindings: 'Все обнаружения по этим инцидентам (агрегат по компании).',
  totalCases: 'Все кейсы по этим же инцидентам (полный набор кейсов в рамках отфильтрованных инцидентов).',
  new: 'Инциденты в статусе OPEN («новые / не закрыты»).',
  assigned:
    'Инциденты не в OPEN, у которых хотя бы у одного обнаружения задан непустой assignedUserId (есть ответственный по обнаружению).',
  inReview:
    'Число уникальных инцидентов, у которых есть кейс в статусе WAITING_VERIFICATION (ожидание проверки).',
  resolved: 'Инциденты в статусе RESOLVED.',
  severityDistribution:
    'Распределение инцидентов по низкой / средней / высокой важности: уровень из правил риска и при необходимости повышается уровнем объекта риска.',
  byCategory:
    'Сколько инцидентов отнесено к каждой категории риска по правилам; без категории — «Без категории», сортировка по имени категории.',
  avgResolutionTime:
    'Среднее время закрытия в часах (целое) по инцидентам RESOLVED с датой закрытия; отсчёт от самой ранней даты обнаружения среди обнаружений инцидента. Для топ-менеджера — полный набор по компании.',
  criticalIncidents:
    'Число инцидентов с наивысшей важностью (по сути дублирует показатель «Высокая» в распределении ниже).',
  overdueActionPlans:
    'Сколько разных планов действий, у которых есть хотя бы одна задача не в DONE с просроченным dueDate.',
  pendingVerifications:
    'Сколько планов действий ещё не проверены: нет записи верификации или verified === false.',
} as const;

const MANAGER_KPI_COLUMN_HINT = {
  manager:
    'Имя: из профиля авторизации; при отсутствии ФИО может быть пусто. Идентификатор — пользователь в системе авторизации.',
  assignedIncidents:
    'Число разных инцидентов, где у этого человека есть назначение: как ответственный по кейсу, и/или как ответственный по обнаружению (объединение по incidentId).',
  resolvedIncidents: 'Сколько из этих инцидентов уже в статусе RESOLVED.',
  cases: 'Кейсы, где он назначен ответственным: активные — статус не CLOSED; закрытые — статус CLOSED.',
  avgResolutionTime:
    'Среднее время закрытия инцидента в часах только по инцидентам из его KPI-набора, RESOLVED с датой закрытия. От самой ранней даты обнаружения среди всех обнаружений инцидента до даты закрытия; инциденты без пригодной даты обнаружения в расчёт среднего не попадают.',
  onTimeCompletion:
    'Процент (0–100) по задачам планов действий (DONE), привязанным к кейсам, где он ответственный: доля с completedAt <= dueDate. Если завершённых задач нет — 0.',
} as const;

const OVERVIEW_SCOPE_LABEL: Record<IncidentsOverviewResponse['scope'], string> = {
  COMPANY: 'Вся компания — показатели по организации в CMS',
  DEPARTMENT: 'Подчинённые отдела',
};

const WF_ORDER: IncidentWorkflowStatusOverview[] = [
  'OPEN',
  'PARTLY_PROGRESS',
  'IN_PROGRESS',
  'RESOLVED',
];

const WF_TITLE_RU: Record<IncidentWorkflowStatusOverview, string> = {
  OPEN: 'Открыты',
  PARTLY_PROGRESS: 'Частично в работе',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решены',
};

/** Подсказки к полям GET /api/incidents/rule-effectiveness (items[]) для топ-менеджера */
const RULE_EFFECTIVENESS_COLUMN_HINT = {
  ruleId:
    'Идентификатор правила из обнаружения: поле rulesId у finding или из details: rulesId / ruleId / rules_id.',
  ruleName: 'Человекочитаемое имя правила из Risk; если сервис не отдал имя или запрос неуспешен — пустая строка.',
  categoryId: 'Категория риска из карточки правила (categoryId), если непустая; иначе null.',
  categoryName:
    'Название категории по справочнику Risk для компании; если категории нет в ответе справочника — null.',
  rejectedCount:
    'Сколько кейсов в выборке со статусом REJECTED, у которых из finding получился этот ruleId.',
  closedCount: 'Сколько кейсов в выборке со статусом CLOSED для того же ruleId.',
  totalCases: 'Сумма отклонённых и закрытых кейсов по этому ruleId в выборке (для наглядности в таблице).',
  ruleActive:
    'true только если в Risk у правила enabled === true; при ошибке загрузки правила считается неактивным (false).',
} as const;

const OV_HINT = {
  scope: 'Для топ-менеджера в ответе обычно COMPANY — цифры по всей организации в рамках одной компании в CMS.',
  incidentsTotal: 'Число инцидентов компании в выборке.',
  open: 'Статус OPEN.',
  partlyProgress: 'Статус PARTLY_PROGRESS.',
  inProgress: 'Статус IN_PROGRESS.',
  resolved: 'Статус RESOLVED.',
  linkedDoc: 'Есть непустой идентификатор привязки к документу (объект наблюдения).',
  withoutDoc: 'Нет привязки к документу.',
  stale: 'Инцидент не в RESOLVED; самая ранняя дата обнаружения по обнаружениям старше 14 суток от текущего момента. Без пригодной даты не попадает в счётчик.',
  findingsTotal: 'Все обнаружения по инцидентам выборки.',
  findingsUnassigned: 'Обнаружения без непустого assignedUserId (нет назначенного исполнителя).',
  casesTotal: 'Все кейсы по инцидентам выборки.',
  waitingVerification: 'Кейсы в статусе WAITING_VERIFICATION.',
  closed: 'Кейсы в статусе CLOSED.',
  other: 'Остальные кейсы: всего минус закрытые минус ожидающие проверки.',
  overduePlans:
    'Сколько разных планов действий, у которых есть хотя бы одна задача не в DONE с просроченным dueDate.',
  hotspots: 'До пяти объектов риска с наибольшим числом инцидентов в выборке, по убыванию incidentCount.',
  sev: 'Распределение инцидентов по важности объекта риска из мониторинга (низкая / средняя / высокая / неизвестно).',
} as const;

/** Подсказки к GET /api/incidents/problem-areas (EXECUTIVE) */
const PA_HINT = {
  monthParam:
    'Календарный месяц YYYY-MM в смысле UTC. Пустое поле — текущий месяц UTC (как в API). Неверный формат — ошибка 400.',
  monthResponse: 'Нормализованный месяц выборки (UTC), по которому строился ответ.',
  groups:
    'По одному элементу на documentId, где в этом месяце ≥ 2 разных инцидента; сортировка по documentId. Порог и логика дат — на стороне API.',
  documentId: 'Общий документ интеграции (идентификатор), по которому в месяце зафиксировано несколько инцидентов.',
  incidentCount: 'Число разных инцидентов по этому documentId в выбранном месяце (≥ 2).',
  incidents:
    'Полные отчёты по каждому инциденту (как GET /api/incidents/:id/report); порядок — по возрастанию incidentId.',
} as const;

const VERIFICATION_QUEUE_HINT =
  'Планы действий в статусе ожидания верификации (GET /api/supervisor/verification/pending, поле items).';

const verificationListTitle = (item: PendingVerificationItem) =>
  item.documentTitle?.trim() || 'Документ без названия';

const responsibleFullName = (r: PendingVerificationItem['responsible']) => {
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

const formatProblemAreasMonthUtc = (ym: string) => {
  if (!ym || !/^\d{4}-\d{2}$/.test(ym)) return ym || '—';
  const [y, mo] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, mo - 1, 1));
  return d.toLocaleString('ru-RU', { month: 'long', year: 'numeric', timeZone: 'UTC' });
};

const labelFromUnknown = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const key of ['documentTitle', 'title', 'documentName', 'fileName', 'name']) {
      const s = o[key];
      if (typeof s === 'string' && s.trim()) return s.trim();
    }
  }
  return '';
};

const groupRiskTitle = (group: IncidentProblemAreaGroup) => {
  const name = labelFromUnknown(group.incidents[0]?.incident?.riskObjectName);
  return name || `Документ интеграции: ${group.documentId}`;
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

const groupIncidentHeat = (group: IncidentProblemAreaGroup): 'CRITICAL' | 'HIGH' | 'MEDIUM' => {
  if (group.incidentCount >= 5) return 'CRITICAL';
  if (group.incidentCount >= 3) return 'HIGH';
  return 'MEDIUM';
};

const CLUSTER_HEAT_RU: Record<'CRITICAL' | 'HIGH' | 'MEDIUM', string> = {
  CRITICAL: 'Критический',
  HIGH: 'Высокий',
  MEDIUM: 'Средний',
};

function getClusterHeatColor(heat: 'CRITICAL' | 'HIGH' | 'MEDIUM'): 'error' | 'warning' | 'info' {
  if (heat === 'CRITICAL') return 'error';
  if (heat === 'HIGH') return 'warning';
  return 'info';
}

function incidentWorkflowStatusRu(status: string): string {
  const m: Partial<Record<IncidentWorkflowStatusOverview, string>> = {
    OPEN: 'Открыт',
    PARTLY_PROGRESS: 'Частично в работе',
    IN_PROGRESS: 'В работе',
    RESOLVED: 'Решён',
  };
  return m[status as IncidentWorkflowStatusOverview] ?? status;
}

function hotspotLabel(name: string | null | undefined, riskObjectId: string): string {
  const t = name?.trim();
  return t || riskObjectId || '—';
}

function safePct(value: number, total: number): number {
  return total > 0 ? Math.round((Math.max(0, value) / total) * 1000) / 10 : 0;
}

function managerDisplayName(m: TeamKPI): string {
  const t = m.managerName?.trim();
  return t || '—';
}

function onTimeChipColor(score: number): 'success' | 'info' | 'warning' | 'error' {
  if (score >= 90) return 'success';
  if (score >= 75) return 'info';
  if (score >= 60) return 'warning';
  return 'error';
}

export const ExecutiveDashboardPage: FC = observer(() => {
  const [loading, setLoading] = useState(true);
  const [incidentStats, setIncidentStats] = useState<IncidentStatistics | null>(null);
  const [managersKpi, setManagersKpi] = useState<TeamKPI[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [ruleEffectivenessError, setRuleEffectivenessError] = useState<string | null>(null);
  const [incidentsOverview, setIncidentsOverview] = useState<IncidentsOverviewResponse | null>(null);
  const [ruleEffectiveness, setRuleEffectiveness] = useState<RuleEffectiveness[]>([]);
  const [problemAreasData, setProblemAreasData] = useState<IncidentProblemAreasResponse | null>(null);
  const [problemAreasError, setProblemAreasError] = useState<string | null>(null);
  /** YYYY-MM для query month; пусто — текущий месяц UTC на бэкенде */
  const [problemAreasMonthInput, setProblemAreasMonthInput] = useState('');
  const problemAreasMonthRef = useRef(problemAreasMonthInput);
  problemAreasMonthRef.current = problemAreasMonthInput;
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [selectedProblemGroup, setSelectedProblemGroup] = useState<IncidentProblemAreaGroup | null>(null);
  const [verificationQueue, setVerificationQueue] = useState<PendingVerificationItem[]>([]);
  const [verificationQueueError, setVerificationQueueError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const sortedManagersKpi = useMemo(() => {
    return [...managersKpi].sort((a, b) => {
      if (b.onTimeCompletion !== a.onTimeCompletion) {
        return b.onTimeCompletion - a.onTimeCompletion;
      }
      return a.avgResolutionTime - b.avgResolutionTime;
    });
  }, [managersKpi]);

  const overviewStatusTotal = useMemo(() => {
    if (!incidentsOverview) return 0;
    return WF_ORDER.reduce((s, k) => s + (incidentsOverview.incidents.byStatus[k] ?? 0), 0);
  }, [incidentsOverview]);

  const overviewHotspotMax = useMemo(() => {
    if (!incidentsOverview?.riskHotspots.length) return 0;
    return Math.max(...incidentsOverview.riskHotspots.map((h) => h.incidentCount), 1);
  }, [incidentsOverview]);

  const overviewSeverityTotal = useMemo(() => {
    if (!incidentsOverview) return 0;
    const d = incidentsOverview.incidentsByRiskObjectSeverity;
    return d.low + d.medium + d.high + d.unknown;
  }, [incidentsOverview]);

  const problemGroups = useMemo(() => problemAreasData?.groups ?? [], [problemAreasData]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setStatsError(null);
    setKpiError(null);
    setOverviewError(null);
    setRuleEffectivenessError(null);
    setProblemAreasError(null);
    setVerificationQueueError(null);

    const monthQ = problemAreasMonthRef.current.trim();
    const settled = await Promise.allSettled([
      IncidentApi.getIncidentStatistics(),
      SupervisorApi.getTeamKPI(),
      SupervisorApi.getIncidentsOverview(),
      SupervisorApi.getRuleEffectiveness(),
      SupervisorApi.getProblemAreas(monthQ || undefined),
      SupervisorApi.getVerificationQueue(),
    ]);

    if (settled[0].status === 'fulfilled') {
      setIncidentStats(settled[0].value);
    } else {
      console.error('Failed to load incident company stats:', settled[0].reason);
      setIncidentStats(null);
      setStatsError('Не удалось загрузить статистику инцидентов компании.');
    }

    if (settled[1].status === 'fulfilled') {
      setManagersKpi(settled[1].value);
    } else {
      console.error('Failed to load managers KPI:', settled[1].reason);
      setManagersKpi([]);
      setKpiError('Не удалось загрузить KPI менеджеров.');
    }

    if (settled[2].status === 'fulfilled') {
      setIncidentsOverview(settled[2].value);
    } else {
      console.error('Failed to load incidents overview:', settled[2].reason);
      setIncidentsOverview(null);
      setOverviewError('Не удалось загрузить обзор инцидентов.');
    }

    if (settled[3].status === 'fulfilled') {
      setRuleEffectiveness(settled[3].value);
    } else {
      console.error('Failed to load rule effectiveness:', settled[3].reason);
      setRuleEffectiveness([]);
      setRuleEffectivenessError('Не удалось загрузить эффективность правил.');
    }

    if (settled[4].status === 'fulfilled') {
      setProblemAreasData(settled[4].value);
    } else {
      console.error('Failed to load problem areas:', settled[4].reason);
      setProblemAreasData(null);
      setProblemAreasError('Не удалось загрузить проблемные зоны.');
    }

    if (settled[5].status === 'fulfilled') {
      setVerificationQueue(settled[5].value);
    } else {
      console.error('Failed to load verification queue:', settled[5].reason);
      setVerificationQueue([]);
      setVerificationQueueError('Не удалось загрузить очередь верификации планов.');
    }

    setUpdatedAt(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Стратегическая панель
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Сводка по инцидентам, обзор, проблемные зоны, очередь верификации, эффективность правил и KPI менеджеров
              {updatedAt ? ` • Обновлено: ${updatedAt.toLocaleString('ru-RU')}` : ''}
            </Typography>
          </Box>
          <Tooltip title="Обновить данные">
            <IconButton onClick={() => void loadStats()} color="primary" aria-label="Обновить">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {statsError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setStatsError(null)}>
            {statsError}
          </Alert>
        )}
        {kpiError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setKpiError(null)}>
            {kpiError}
          </Alert>
        )}
        {overviewError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOverviewError(null)}>
            {overviewError}
          </Alert>
        )}
        {ruleEffectivenessError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRuleEffectivenessError(null)}>
            {ruleEffectivenessError}
          </Alert>
        )}
        {problemAreasError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProblemAreasError(null)}>
            {problemAreasError}
          </Alert>
        )}
        {verificationQueueError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setVerificationQueueError(null)}>
            {verificationQueueError}
          </Alert>
        )}

        {incidentStats && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BarChartIcon color="primary" />
              Инциденты компании
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Данные из API инцидентов для роли топ-менеджера: охват по компании, не только назначенные на вас.
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {(
                [
                  {
                    label: 'Всего инцидентов',
                    value: incidentStats.totalIncidents,
                    hint: INCIDENT_COMPANY_STATS_HINT.totalIncidents,
                  },
                  {
                    label: 'Всего обнаружений',
                    value: incidentStats.totalFindings,
                    hint: INCIDENT_COMPANY_STATS_HINT.totalFindings,
                  },
                  {
                    label: 'Всего кейсов',
                    value: incidentStats.totalCases,
                    hint: INCIDENT_COMPANY_STATS_HINT.totalCases,
                  },
                  {
                    label: 'Ср. время закрытия',
                    value: `${incidentStats.avgResolutionTime} ч`,
                    hint: INCIDENT_COMPANY_STATS_HINT.avgResolutionTime,
                  },
                ] as const
              ).map((m) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={m.label}>
                  <Tooltip title={m.hint} placement="top" enterTouchDelay={0}>
                    <Card variant="outlined" sx={{ height: '100%', cursor: 'help' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {m.label}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {m.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              {(
                [
                  {
                    label: 'Критичные (high)',
                    value: incidentStats.criticalIncidents,
                    hint: INCIDENT_COMPANY_STATS_HINT.criticalIncidents,
                    color: 'error.main' as const,
                  },
                  {
                    label: 'Просроченные планы',
                    value: incidentStats.overdueActionPlans,
                    hint: INCIDENT_COMPANY_STATS_HINT.overdueActionPlans,
                    color: 'warning.main' as const,
                  },
                  {
                    label: 'Ожидают проверки планов',
                    value: incidentStats.pendingVerifications,
                    hint: INCIDENT_COMPANY_STATS_HINT.pendingVerifications,
                    color: 'info.main' as const,
                  },
                ] as const
              ).map((m) => (
                <Grid size={{ xs: 12, sm: 4 }} key={m.label}>
                  <Tooltip title={m.hint} placement="top" enterTouchDelay={0}>
                    <Card variant="outlined" sx={{ height: '100%', cursor: 'help' }}>
                      <CardContent sx={{ py: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {m.label}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color={m.color}>
                          {m.value}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
              Статусы инцидентов
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              Наведите на значение для пояснения по полям API.
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {(
                [
                  { key: 'new', label: 'Новые (OPEN)', hint: INCIDENT_COMPANY_STATS_HINT.new },
                  { key: 'assigned', label: 'С назначением', hint: INCIDENT_COMPANY_STATS_HINT.assigned },
                  { key: 'inReview', label: 'На проверке кейса', hint: INCIDENT_COMPANY_STATS_HINT.inReview },
                  { key: 'resolved', label: 'Решены', hint: INCIDENT_COMPANY_STATS_HINT.resolved },
                ] as const
              ).map((row) => {
                const v = incidentStats[row.key];
                return (
                  <Grid size={{ xs: 6, sm: 3 }} key={row.key}>
                    <Tooltip title={row.hint} placement="top" enterTouchDelay={0}>
                      <Box sx={{ cursor: 'help' }}>
                        <Typography variant="caption" color="text.secondary">
                          {row.label}
                        </Typography>
                        <Typography variant="h6">{v}</Typography>
                      </Box>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>

            <Tooltip title={INCIDENT_COMPANY_STATS_HINT.severityDistribution} placement="top">
              <Typography variant="subtitle2" gutterBottom sx={{ cursor: 'help', width: 'fit-content' }}>
                Распределение по важности
              </Typography>
            </Tooltip>
            {(() => {
              const sevT =
                incidentStats.bySeverity.low +
                incidentStats.bySeverity.medium +
                incidentStats.bySeverity.high;
              const pct = (n: number) => (sevT > 0 ? Math.round((n / sevT) * 1000) / 10 : 0);
              const rows = [
                { label: 'Низкая', cnt: incidentStats.bySeverity.low, color: 'success' as const },
                { label: 'Средняя', cnt: incidentStats.bySeverity.medium, color: 'info' as const },
                { label: 'Высокая', cnt: incidentStats.bySeverity.high, color: 'warning' as const },
              ];
              return (
                <Stack spacing={1.25} sx={{ mb: 2 }}>
                  {rows.map((r) => (
                    <Box key={r.label}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 0.35,
                          gap: 1,
                        }}
                      >
                        <Typography variant="body2">{r.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.cnt} ({pct(r.cnt)}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={pct(r.cnt)}
                        color={r.color}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>
                  ))}
                </Stack>
              );
            })()}

            <Tooltip title={INCIDENT_COMPANY_STATS_HINT.byCategory} placement="top">
              <Typography variant="subtitle2" gutterBottom sx={{ cursor: 'help', width: 'fit-content' }}>
                По категориям риска
              </Typography>
            </Tooltip>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Категория</TableCell>
                    <TableCell align="right">Инцидентов</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {incidentStats.byCategory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2}>
                        <Typography variant="body2" color="text.secondary">
                          Нет данных по категориям
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    incidentStats.byCategory.map((c, idx) => (
                      <TableRow key={`${idx}-${c.categoryName}-${c.categoryId ?? ''}`} hover>
                        <TableCell>
                          {c.categoryName}
                          {c.categoryId && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontFamily="monospace"
                            >
                              {c.categoryId}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">{c.incidentCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {incidentsOverview && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InsightsIcon color="primary" />
                  Обзор инцидентов
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {OVERVIEW_SCOPE_LABEL[incidentsOverview.scope]}
                </Typography>
              </Box>
              <Tooltip title={OV_HINT.scope}>
                <Chip label={incidentsOverview.scope} size="small" color="primary" variant="outlined" />
              </Tooltip>
            </Box>

            <Typography variant="subtitle2" gutterBottom>
              Конвейер инцидентов
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Tooltip title={OV_HINT.incidentsTotal}>
                  <Card variant="outlined" sx={{ cursor: 'help' }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Всего в выборке
                      </Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {incidentsOverview.incidents.total}
                      </Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
              {WF_ORDER.map((key) => {
                const cnt = incidentsOverview.incidents.byStatus[key] ?? 0;
                const pct = safePct(cnt, overviewStatusTotal);
                const hint =
                  key === 'OPEN'
                    ? OV_HINT.open
                    : key === 'PARTLY_PROGRESS'
                      ? OV_HINT.partlyProgress
                      : key === 'IN_PROGRESS'
                        ? OV_HINT.inProgress
                        : OV_HINT.resolved;
                return (
                  <Grid size={{ xs: 6, sm: 6, md: 2 }} key={key}>
                    <Tooltip title={hint}>
                      <Card variant="outlined" sx={{ cursor: 'help' }}>
                        <CardContent sx={{ py: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {WF_TITLE_RU[key]}
                          </Typography>
                          <Typography variant="h6">{cnt}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {pct}% от суммы статусов
                          </Typography>
                        </CardContent>
                      </Card>
                    </Tooltip>
                  </Grid>
                );
              })}
            </Grid>

            <Typography variant="subtitle2" gutterBottom>
              Привязка к документу и «стейл»
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Tooltip title={OV_HINT.linkedDoc}>
                  <Card variant="outlined" sx={{ cursor: 'help' }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        С привязкой к документу
                      </Typography>
                      <Typography variant="h6">{incidentsOverview.incidents.withDocumentId}</Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Tooltip title={OV_HINT.withoutDoc}>
                  <Card variant="outlined" sx={{ cursor: 'help' }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Без привязки
                      </Typography>
                      <Typography variant="h6">{incidentsOverview.incidents.withoutDocumentId}</Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Tooltip title={OV_HINT.stale}>
                  <Card variant="outlined" sx={{ cursor: 'help' }}>
                    <CardContent sx={{ py: 1.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Устарели без решения (&gt;14 сут.)
                      </Typography>
                      <Typography variant="h6" color="warning.main">
                        {incidentsOverview.incidents.staleUnresolved}
                      </Typography>
                    </CardContent>
                  </Card>
                </Tooltip>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Grid container spacing={3} sx={{ mb: 2 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Обнаружения
                </Typography>
                <Tooltip title={OV_HINT.findingsTotal}>
                  <Typography variant="body2" sx={{ cursor: 'help' }}>
                    Всего: <strong>{incidentsOverview.findings.total}</strong>
                  </Typography>
                </Tooltip>
                <Tooltip title={OV_HINT.findingsUnassigned}>
                  <Typography variant="body2" color="text.secondary" sx={{ cursor: 'help' }}>
                    Без ответственного: <strong>{incidentsOverview.findings.withoutAssignedUser}</strong>
                  </Typography>
                </Tooltip>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Кейсы
                </Typography>
                <Tooltip title={OV_HINT.casesTotal}>
                  <Typography variant="body2" sx={{ cursor: 'help' }}>
                    Всего: <strong>{incidentsOverview.cases.total}</strong>
                  </Typography>
                </Tooltip>
                <Typography variant="body2" color="text.secondary">
                  <Tooltip title={OV_HINT.waitingVerification}>
                    <Box component="span" sx={{ cursor: 'help' }}>
                      Ожидание проверки: <strong>{incidentsOverview.cases.waitingVerification}</strong>
                    </Box>
                  </Tooltip>
                  {' · '}
                  <Tooltip title={OV_HINT.closed}>
                    <Box component="span" sx={{ cursor: 'help' }}>
                      Закрыты: <strong>{incidentsOverview.cases.closed}</strong>
                    </Box>
                  </Tooltip>
                  {' · '}
                  <Tooltip title={OV_HINT.other}>
                    <Box component="span" sx={{ cursor: 'help' }}>
                      Прочие: <strong>{incidentsOverview.cases.other}</strong>
                    </Box>
                  </Tooltip>
                </Typography>
              </Grid>
            </Grid>

            <Tooltip title={OV_HINT.overduePlans}>
              <Typography variant="body2" sx={{ mb: 2, cursor: 'help', width: 'fit-content' }}>
                Планы с просроченными задачами:{' '}
                <Chip
                  label={incidentsOverview.actionPlans.withOverdueTasks}
                  size="small"
                  color={incidentsOverview.actionPlans.withOverdueTasks > 0 ? 'error' : 'default'}
                />
              </Typography>
            </Tooltip>

            <Typography variant="subtitle2" gutterBottom>
              Точки риска (до 5)
            </Typography>
            <Tooltip title={OV_HINT.hotspots}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, cursor: 'help' }}>
                Объекты с наибольшим числом инцидентов в выборке
              </Typography>
            </Tooltip>
            {incidentsOverview.riskHotspots.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Нет данных по точкам риска.
              </Typography>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 2 }}>
                {incidentsOverview.riskHotspots.map((h) => (
                  <Box key={h.riskObjectId}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hotspotLabel(h.name, h.riskObjectId)}
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

            <Tooltip title={OV_HINT.sev}>
              <Typography variant="subtitle2" gutterBottom sx={{ cursor: 'help', width: 'fit-content' }}>
                Важность объекта риска (мониторинг)
              </Typography>
            </Tooltip>
            <Stack spacing={1.25}>
              {(
                [
                  { key: 'low' as const, label: 'Низкая', color: 'success' as const },
                  { key: 'medium' as const, label: 'Средняя', color: 'info' as const },
                  { key: 'high' as const, label: 'Высокая', color: 'warning' as const },
                  { key: 'unknown' as const, label: 'Неизвестно', color: 'inherit' as const },
                ] as const
              ).map((row) => {
                const cnt = incidentsOverview.incidentsByRiskObjectSeverity[row.key];
                const pct = safePct(cnt, overviewSeverityTotal);
                return (
                  <Box key={row.key}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.35, gap: 1 }}>
                      <Typography variant="body2">{row.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {cnt} ({pct}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      color={row.color}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>
        )}

        <Paper sx={{ p: 3, mt: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ErrorIcon color="error" />
              Проблемные зоны
            </Typography>
            {problemGroups.length > 0 && (
              <Tooltip title={PA_HINT.groups}>
                <Chip label={`${problemGroups.length} групп`} size="small" color="warning" variant="outlined" />
              </Tooltip>
            )}
          </Box>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', mb: 2 }}>
            <Tooltip title={PA_HINT.monthParam}>
              <TextField
                label="Месяц (UTC), YYYY-MM"
                type="month"
                size="small"
                value={problemAreasMonthInput}
                onChange={(e) => setProblemAreasMonthInput(e.target.value)}
                slotProps={{ htmlInput: { 'aria-label': 'Месяц для problem-areas' } }}
                sx={{ minWidth: 200 }}
              />
            </Tooltip>
            <Button variant="outlined" size="small" onClick={() => void loadStats()}>
              Загрузить за месяц
            </Button>
          </Box>

          {problemAreasData?.month ? (
            <Tooltip title={PA_HINT.monthResponse}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, cursor: 'help', width: 'fit-content' }}>
                Отчётный месяц (UTC): <strong>{problemAreasData.month}</strong> (
                {formatProblemAreasMonthUtc(problemAreasData.month)})
              </Typography>
            </Tooltip>
          ) : problemAreasError ? null : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Месяц появится в ответе API после успешной загрузки.
            </Typography>
          )}

          {problemAreasError ? (
            <Typography variant="body2" color="text.secondary">
              Блок не заполнен из-за ошибки (см. сообщение выше). Нажмите «Обновить» в шапке или «Загрузить за месяц».
            </Typography>
          ) : problemGroups.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Нет групп: нет documentId с более чем одним инцидентом в выбранном месяце (логика API) или ответ пустой.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2} sx={{ maxHeight: 560, overflow: 'auto' }}>
              {problemGroups.map((group) => {
                const heat = groupIncidentHeat(group);
                const allRules = Array.from(new Set(group.incidents.flatMap((rep) => incidentRuleNames(rep))));
                const rulesPreview = allRules.slice(0, 3);
                const casesTotal = countCasesInProblemGroup(group);
                const heatColor = getClusterHeatColor(heat);
                return (
                  <Card
                    key={group.documentId}
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 2 },
                      borderLeft: 4,
                      borderLeftColor: `${heatColor}.main`,
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
                        <Chip label={CLUSTER_HEAT_RU[heat]} size="small" color={heatColor} />
                      </Box>
                      <Tooltip title={PA_HINT.documentId}>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, cursor: 'help' }}>
                          documentId: {group.documentId}
                        </Typography>
                      </Tooltip>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {rulesPreview.length > 0
                          ? `Правила (фрагмент): ${rulesPreview.join(', ')}${allRules.length > rulesPreview.length ? '…' : ''}`
                          : 'Правила — в обнаружениях отчёта.'}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Tooltip title={PA_HINT.incidentCount}>
                          <Chip label={`Инцидентов: ${group.incidentCount}`} size="small" variant="outlined" />
                        </Tooltip>
                        <Tooltip title="Сумма кейсов по обнаружениям в отчётах группы">
                          <Chip label={`Кейсов: ${casesTotal}`} size="small" variant="outlined" />
                        </Tooltip>
                      </Box>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Нажмите карточку, чтобы открыть список инцидентов.
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2 }}>
            <Tooltip title={VERIFICATION_QUEUE_HINT}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'help' }}>
                <AssessmentIcon color="warning" />
                Очередь верификации планов
              </Typography>
            </Tooltip>
            <Badge badgeContent={verificationQueue.length} color="error" overlap="rectangular">
              <Chip label="Ожидают проверки" size="small" color="warning" variant="outlined" />
            </Badge>
          </Box>

          {verificationQueueError ? (
            <Typography variant="body2" color="text.secondary">
              Список не загружен (см. сообщение об ошибке выше).
            </Typography>
          ) : verificationQueue.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Очередь пуста — нет планов, ожидающих верификации, в выборке для вашей роли.
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0, maxHeight: 420, overflow: 'auto' }}>
              {verificationQueue.map((item, index) => (
                <Box key={item.actionPlanId}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                      <AssessmentIcon color="primary" fontSize="small" />
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
                          <Typography variant="caption" display="block" component="span">
                            Ответственный: {responsibleFullName(item.responsible)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" component="span">
                            Инцидент: {item.incidentId} • План: {item.actionPlanId}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" component="span">
                            Поступление инцидента: {formatVerificationInstant(item.incidentReceivedAt)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < verificationQueue.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          )}
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShieldIcon color="primary" />
            Эффективность правил
          </Typography>

          {ruleEffectivenessError ? (
            <Typography variant="body2" color="text.secondary">
              Таблица не заполнена из-за ошибки загрузки (см. сообщение выше).
            </Typography>
          ) : ruleEffectiveness.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Нет строк в ответе API или список пуст.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 480 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Tooltip title={RULE_EFFECTIVENESS_COLUMN_HINT.ruleName} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Правило
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={`${RULE_EFFECTIVENESS_COLUMN_HINT.categoryName}\n${RULE_EFFECTIVENESS_COLUMN_HINT.categoryId}`} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Категория
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={RULE_EFFECTIVENESS_COLUMN_HINT.rejectedCount} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Отклонено (REJECTED)
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={RULE_EFFECTIVENESS_COLUMN_HINT.closedCount} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Закрыто (CLOSED)
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title={RULE_EFFECTIVENESS_COLUMN_HINT.totalCases} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Всего кейсов
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={RULE_EFFECTIVENESS_COLUMN_HINT.ruleActive} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          В CMS Risk
                        </Box>
                      </Tooltip>
                    </TableCell>
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
                          <Tooltip title={RULE_EFFECTIVENESS_COLUMN_HINT.ruleId}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              fontFamily="monospace"
                              sx={{ cursor: 'help' }}
                            >
                              {rule.ruleId}
                            </Typography>
                          </Tooltip>
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
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            KPI менеджеров
          </Typography>

          {kpiError ? (
            <Typography variant="body2" color="text.secondary">
              Таблица не заполнена из-за ошибки загрузки (см. сообщение выше).
            </Typography>
          ) : sortedManagersKpi.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Нет строк: нет менеджеров с назначениями на инцидентах или кейсах в выборке для вашей роли.
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 520 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Tooltip title={MANAGER_KPI_COLUMN_HINT.manager} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Менеджер
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={MANAGER_KPI_COLUMN_HINT.assignedIncidents} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Назначено инцидентов
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={MANAGER_KPI_COLUMN_HINT.resolvedIncidents} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Решено
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={MANAGER_KPI_COLUMN_HINT.cases} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Кейсы (акт. / закр.)
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={MANAGER_KPI_COLUMN_HINT.avgResolutionTime} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          Ср. время, ч
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Tooltip title={MANAGER_KPI_COLUMN_HINT.onTimeCompletion} placement="top">
                        <Box component="span" sx={{ cursor: 'help' }}>
                          В срок по задачам
                        </Box>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedManagersKpi.map((m) => (
                    <TableRow key={m.managerId} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {managerDisplayName(m)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontFamily="monospace" display="block">
                          {m.managerId}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{m.assignedIncidents}</TableCell>
                      <TableCell align="right">{m.resolvedIncidents}</TableCell>
                      <TableCell align="right">
                        {m.activeCases} / {m.completedCases}
                      </TableCell>
                      <TableCell align="right">{m.avgResolutionTime}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            label={`${m.onTimeCompletion}%`}
                            size="small"
                            color={onTimeChipColor(m.onTimeCompletion)}
                          />
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, Math.max(0, m.onTimeCompletion))}
                            color={onTimeChipColor(m.onTimeCompletion)}
                            sx={{ flex: 1, minWidth: 48, height: 6, borderRadius: 1 }}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

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
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Typography variant="h6" component="div">
                    {groupRiskTitle(selectedProblemGroup)}
                  </Typography>
                  <Chip
                    label={CLUSTER_HEAT_RU[groupIncidentHeat(selectedProblemGroup)]}
                    color={getClusterHeatColor(groupIncidentHeat(selectedProblemGroup))}
                    size="small"
                  />
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" component="div">
                    <Box component="span" fontWeight="bold">
                      {formatProblemAreasMonthUtc(problemAreasData?.month ?? '')}
                    </Box>{' '}
                    (<Box component="span" sx={{ fontFamily: 'monospace' }}>{problemAreasData?.month ?? '—'}</Box>
                    , UTC): один <Box component="span" fontWeight="bold">documentId</Box> —{' '}
                    <Box component="span" fontWeight="bold">{selectedProblemGroup.incidentCount}</Box> связанных
                    инцидентов в месяце.
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }} component="div">
                    documentId:{' '}
                    <Box component="span" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                      {selectedProblemGroup.documentId}
                    </Box>
                  </Typography>
                </Alert>

                <Tooltip title={PA_HINT.incidents}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, cursor: 'help', width: 'fit-content' }}>
                    Инциденты (элементы отчёта из API)
                  </Typography>
                </Tooltip>

                <Stack spacing={2}>
                  {selectedProblemGroup.incidents.map((rep) => {
                    const rules = incidentRuleNames(rep);
                    const casesTotal = rep.findings.reduce((s, f) => s + f.cases.length, 0);
                    return (
                      <Paper key={rep.incident.id} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom component="div">
                          Инцидент{' '}
                          <Box component="span" sx={{ fontFamily: 'monospace' }}>
                            {rep.incident.id}
                          </Box>{' '}
                          <Chip
                            label={incidentWorkflowStatusRu(rep.incident.status)}
                            size="small"
                            sx={{ ml: 1 }}
                            variant="outlined"
                          />
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom component="div">
                          Объект риска:{' '}
                          <Box component="span" fontWeight="bold">
                            {labelFromUnknown(rep.incident.riskObjectName) || '—'}
                          </Box>{' '}
                          · Интеграция:{' '}
                          {labelFromUnknown(rep.incident.integrationName) || String(rep.incident.integrationId)}
                        </Typography>
                        <Typography variant="caption" display="block" sx={{ mb: 1 }} component="div">
                          riskObjectId:{' '}
                          <Box component="span" sx={{ fontFamily: 'monospace' }}>
                            {rep.incident.riskObjectId || '—'}
                          </Box>
                          {' · '}
                          Обнаружений: <strong>{rep.findings.length}</strong>, кейсов суммарно:{' '}
                          <strong>{casesTotal}</strong>
                        </Typography>
                        {rules.length > 0 ? (
                          <Typography variant="body2" component="div">
                            Правила: {[...new Set(rules)].join(', ')}
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary" component="div">
                            У обнаружений может не быть ruleName — см. массив обнаружений в ответе API.
                          </Typography>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setProblemDialogOpen(false)}>Закрыть</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
});
