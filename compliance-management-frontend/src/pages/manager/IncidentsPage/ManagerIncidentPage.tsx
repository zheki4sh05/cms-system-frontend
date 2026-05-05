// src/pages/manager/IncidentsPage/IncidentsPage.tsx

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
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Stack,
  Tabs,
  Tab,
  Collapse,
  MobileStepper,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  FolderOpen as CaseIcon,
  Info as InfoIcon,
  PlayArrow as StartIcon,
  CheckCircle as ResolveIcon,
  BarChart as ChartIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { IncidentApi } from '@shared/lib/api/incidentApi';
import { getIncidentStatusLabelRu } from '@shared/lib/statusLabels';
import { RuleApi } from '@shared/lib/api/ruleApi';
import { useAuthStore } from '@features/auth/useAuthStore';
import {
  type Incident,
  IncidentStatus,
  type IncidentSeverity,
  type IncidentCategory,
  type IncidentStatistics,
  type IncidentFilter,
  type IncidentViewDto,
  type RuleShortInfo,
} from '@shared/types/incidentTypes';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/** Кнопка assign-to-me для PARTLY_PROGRESS, если текущий пользователь ещё не в employees. */
function shouldShowAssignToMeForPartlyProgress(incident: Incident, currentUserId?: string): boolean {
  if (incident.status !== 'PARTLY_PROGRESS') return false;
  if (!currentUserId) return false;
  const employees = incident.employees;
  if (!employees?.length) return true;
  return !employees.some((e) => e.userId === currentUserId);
}

export const ManagerIncidentsPage: FC = observer(() => {
  const navigate = useNavigate();
  const authStore = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statistics, setStatistics] = useState<IncidentStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Фильтры
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<IncidentFilter>({});
  
  // Выбор инцидентов для объединения
  const [selectedIncidents, setSelectedIncidents] = useState<string[]>([]);
  
  // Диалоги
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [createCaseDialogOpen, setCreateCaseDialogOpen] = useState(false);
  
  // Выбранный инцидент
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  const [incidentViewLoading, setIncidentViewLoading] = useState(false);
  const [incidentViewData, setIncidentViewData] = useState<IncidentViewDto | null>(null);
  const [findingSlides, setFindingSlides] = useState<
    Array<{
      findingId: string;
      rule: RuleShortInfo | null;
      responsibleUserName: string;
      details: {
        title?: string;
        severity?: string;
        description?: string;
        recommendation?: string;
      };
    }>
  >([]);
  const [activeFindingIndex, setActiveFindingIndex] = useState(0);
  
  // Форма резолюции
  const [resolutionType, setResolutionType] = useState<'resolved' | 'false_positive'>('resolved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [falsePositiveReason, setFalsePositiveReason] = useState('');
  
  // Форма создания случая
  const [caseTitle, setCaseTitle] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseSeverity, setCaseSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [casePriority, setCasePriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');

  useEffect(() => {
    loadIncidents();
  }, [filters]);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const incidentsData = await IncidentApi.getMyIncidents(filters);
      setIncidents(incidentsData);

      try {
        const statsData = await IncidentApi.getIncidentStatistics();
        setStatistics(statsData);
      } catch (statsError) {
        console.error('Failed to load incident statistics:', statsError);
        setStatistics(null);
      }
    } catch (error) {
      console.error('Failed to load incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeId = (value: unknown): string => {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  };

  const handleOpenIncident = async (incident: Incident) => {
    setSelectedIncident(incident);
    setViewDialogOpen(true);
    setIncidentViewLoading(true);
    setIncidentViewData(null);
    setFindingSlides([]);
    setActiveFindingIndex(0);

    try {
      const viewData = await IncidentApi.getIncidentView(incident.id);
      setIncidentViewData(viewData);

      const currentUserId = authStore.user?.id;
      const rulesIds = viewData.findings
        .map((finding) => normalizeId(finding.rulesId))
        .filter((id) => id.length > 0);

      const uniqueRuleIds = Array.from(new Set(rulesIds));
      const ruleEntries = await Promise.all(
        uniqueRuleIds.map(async (ruleId) => {
          try {
            const rule = await RuleApi.getRuleShort(ruleId);
            return [ruleId, rule] as const;
          } catch (ruleError) {
            console.error(`Failed to load short rule ${ruleId}:`, ruleError);
            return [ruleId, null] as const;
          }
        })
      );
      const ruleMap = new Map<string, RuleShortInfo | null>(ruleEntries);

      const responsibleUserIds = Array.from(
        new Set(
          ruleEntries
            .map(([, rule]) => rule?.responsibleUserId ?? '')
            .filter((id) => id.length > 0 && id !== currentUserId)
        )
      );

      const userEntries = await Promise.all(
        responsibleUserIds.map(async (userId) => {
          try {
            const user = await IncidentApi.getUserBasicInfo(userId);
            const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
            return [userId, user.fullName || fullName || user.email || userId] as const;
          } catch (userError) {
            console.error(`Failed to load user ${userId}:`, userError);
            return [userId, userId] as const;
          }
        })
      );
      const userNameMap = new Map<string, string>(userEntries);

      const slides = viewData.findings.map((finding) => {
        const ruleId = normalizeId(finding.rulesId);
        const rule = ruleMap.get(ruleId) ?? null;
        const responsibleUserId = rule?.responsibleUserId ?? '';
        const rawDetails = (finding.details ?? {}) as Record<string, unknown>;
        const responsibleUserName =
          responsibleUserId && currentUserId && responsibleUserId === currentUserId
            ? 'Вы'
            : userNameMap.get(responsibleUserId) || responsibleUserId || '-';

        return {
          findingId: finding.id,
          rule,
          responsibleUserName,
          details: {
            title: typeof rawDetails.title === 'string' ? rawDetails.title : undefined,
            severity: typeof rawDetails.severity === 'string' ? rawDetails.severity : undefined,
            description: typeof rawDetails.description === 'string' ? rawDetails.description : undefined,
            recommendation:
              typeof rawDetails.recommendation === 'string' ? rawDetails.recommendation : undefined,
          },
        };
      });
      setFindingSlides(slides);
    } catch (error) {
      console.error('Failed to load incident view:', error);
      setIncidentViewData(null);
      setFindingSlides([]);
    } finally {
      setIncidentViewLoading(false);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setSelectedIncident(null);
    setIncidentViewData(null);
    setFindingSlides([]);
    setActiveFindingIndex(0);
  };

  const handleOpenResolveDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setResolveDialogOpen(true);
  };

  const handleResolveIncident = async () => {
    if (!selectedIncident) return;
    
    try {
   await IncidentApi.resolveIncident(selectedIncident.id, {
        status: resolutionType === 'resolved' 
          ? IncidentStatus.RESOLVED 
          : IncidentStatus.FALSE_POSITIVE,
        resolutionNotes: resolutionType === 'resolved' ? resolutionNotes : undefined,
        falsePositiveReason: resolutionType === 'false_positive' ? falsePositiveReason : undefined,
      });

      
      await loadIncidents();
      setResolveDialogOpen(false);
      setSelectedIncident(null);
      setResolutionNotes('');
      setFalsePositiveReason('');
    } catch (error) {
      console.error('Failed to resolve incident:', error);
    }
  };

  const handleSelectIncident = (incidentId: string) => {
    setSelectedIncidents(prev =>
      prev.includes(incidentId)
        ? prev.filter(id => id !== incidentId)
        : [...prev, incidentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIncidents.length === filteredIncidents.length) {
      setSelectedIncidents([]);
    } else {
      setSelectedIncidents(filteredIncidents.map(i => i.id));
    }
  };

  const handleOpenCreateCaseDialog = () => {
    if (selectedIncidents.length === 0) return;
    
    // Автозаполнение данных из выбранных инцидентов
    const selectedIncidentObjects = incidents.filter(i => selectedIncidents.includes(i.id));
    const titles = selectedIncidentObjects.map(i => i.title).join(', ');
    setCaseTitle(`Случай: ${titles.substring(0, 100)}...`);
    
    const descriptions = selectedIncidentObjects.map(i => 
      `• ${i.title} (${i.id}): ${i.description}`
    ).join('\n');
    setCaseDescription(descriptions);
    
    // Максимальная критичность
    const maxSeverity = selectedIncidentObjects.reduce((max, i) => {
      const order = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      return order[i.severity] > order[max] ? i.severity : max;
    }, 'LOW' as IncidentSeverity);
    setCaseSeverity(maxSeverity);
    
    setCreateCaseDialogOpen(true);
  };

  const handleCreateCase = async () => {
    try {
      const newCase = await IncidentApi.createCaseFromIncidents({
        incidentIds: selectedIncidents,
        title: caseTitle,
        description: caseDescription,
        severity: caseSeverity,
        priority: casePriority,
      });
      
      await loadIncidents();
      setCreateCaseDialogOpen(false);
      setSelectedIncidents([]);
      
      // Перейти к созданному случаю
      navigate('/manager/cases');
    } catch (error) {
      console.error('Failed to create case:', error);
    }
  };

  const handleAssignToMe = async (incidentId: string) => {
    try {
      const assignResult = await IncidentApi.assignToMe(incidentId);
      const targetIncidentId = assignResult.incidentId || assignResult.id || incidentId;
      const rawStatus = assignResult.status;
      const normalized =
        typeof rawStatus === 'string' ? rawStatus.toUpperCase() : 'ASSIGNED';
      const statusMap: Record<string, IncidentStatus> = {
        NEW: 'NEW',
        OPEN: 'NEW',
        ASSIGNED: 'ASSIGNED',
        PARTLY_PROGRESS: 'PARTLY_PROGRESS',
        PARTLY_PROGGRESS: 'PARTLY_PROGRESS',
        IN_PROGRESS: 'IN_REVIEW',
        IN_REVIEW: 'IN_REVIEW',
        RESOLVED: 'RESOLVED',
        CLOSED: 'RESOLVED',
        FALSE_POSITIVE: 'FALSE_POSITIVE',
        ESCALATED_TO_CASE: 'ESCALATED_TO_CASE',
      };
      const nextStatus = statusMap[normalized] || 'NEW';
      const uid = authStore.user?.id;
      const mergeSelfEmployees = (inc: Incident): Incident['employees'] => {
        if (!uid) return inc.employees;
        const list = [...(inc.employees ?? [])];
        if (!list.some((e) => e.userId === uid)) list.push({ userId: uid });
        return list;
      };

      setIncidents((prev) =>
        prev.map((incident) =>
          incident.id === targetIncidentId
            ? {
                ...incident,
                status: nextStatus,
                assignedTo: uid || incident.assignedTo,
                employees: mergeSelfEmployees(incident),
              }
            : incident
        )
      );
      setSelectedIncident((prev) =>
        prev && prev.id === targetIncidentId
          ? {
              ...prev,
              status: nextStatus,
              assignedTo: uid || prev.assignedTo,
              employees: mergeSelfEmployees(prev),
            }
          : prev
      );

      // Финальная синхронизация, если сервер вернул дополнительные изменения
      await loadIncidents();
    } catch (error) {
      console.error('Failed to assign incident:', error);
    }
  };

  const getSeverityColor = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
    }
  };

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'NEW': return 'error';
      case 'ASSIGNED': return 'warning';
      case 'PARTLY_PROGRESS': return 'warning';
      case 'IN_REVIEW': return 'info';
      case 'RESOLVED': return 'success';
      case 'FALSE_POSITIVE': return 'default';
      case 'ESCALATED_TO_CASE': return 'secondary';
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    return getIncidentStatusLabelRu(status);
  };

  const getCategoryLabel = (category: IncidentCategory) => {
    const labels = {
      FINANCIAL: 'Финансы',
      VENDOR: 'Контрагенты',
      COMPLIANCE: 'Комплаенс',
      LOGISTICS: 'Логистика',
      DATA_QUALITY: 'Качество данных',
      ETHICS: 'Этика',
    };
    return labels[category];
  };

  const stringifyCategoryValue = (value: unknown): string => {
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

  const getIncidentDescription = (incident: Incident): string => {
    return incident.incidentDescription || incident.description || '-';
  };

  const getCategoryDisplay = (incident: Incident): string => {
    if (incident.categoryName != null) {
      return stringifyCategoryValue(incident.categoryName);
    }
    if (incident.categoryId != null) {
      return stringifyCategoryValue(incident.categoryId);
    }
    return getCategoryLabel(incident.category);
  };

  const getPriorityLabel = (priority?: string): string => {
    if (!priority) return '-';
    const labels: Record<string, string> = {
      LOW: 'Низкий',
      MEDIUM: 'Средний',
      HIGH: 'Высокий',
      CRITICAL: 'Критичный',
    };
    return labels[priority.toUpperCase()] || priority;
  };

  const getSeverityLabel = (severity?: string): string => {
    if (!severity) return '-';
    const labels: Record<string, string> = {
      LOW: 'Низкая',
      MEDIUM: 'Средняя',
      HIGH: 'Высокая',
      CRITICAL: 'Критичная',
    };
    return labels[severity.toUpperCase()] || severity;
  };

  const filteredIncidents = incidents.filter(i => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        (i.riskObjectId || '').toLowerCase().includes(query) ||
        (i.riskObjectName || '').toLowerCase().includes(query) ||
        getIncidentDescription(i).toLowerCase().includes(query) ||
        stringifyCategoryValue(i.categoryName).toLowerCase().includes(query) ||
        stringifyCategoryValue(i.categoryId).toLowerCase().includes(query)
      );
    }
    return true;
  });

  const newIncidents = filteredIncidents.filter(i => i.status === 'NEW');
  const startedIncidents = filteredIncidents.filter(
    i => i.status === 'ASSIGNED' || i.status === 'PARTLY_PROGRESS'
  );
  const inProgressIncidents = filteredIncidents.filter(i => i.status === 'IN_REVIEW');
  const resolvedIncidents = filteredIncidents.filter(i => 
    i.status === 'RESOLVED' || i.status === 'FALSE_POSITIVE' || i.status === 'ESCALATED_TO_CASE'
  );
  const activeFindingSlide = findingSlides[activeFindingIndex] || null;

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
        {/* Заголовок и действия */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            Инциденты
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {selectedIncidents.length > 0 && (
              <Button
                variant="contained"
                startIcon={<CaseIcon />}
                onClick={handleOpenCreateCaseDialog}
              >
                Создать случай ({selectedIncidents.length})
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterOpen(!filterOpen)}
            >
              Фильтры
            </Button>
          </Box>
        </Box>

        {/* Статистика */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{xs:12, sm:6, md: 3}}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => setTabValue(0)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Badge badgeContent={statistics.new} color="error">
                    <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />
                  </Badge>
                  <Typography variant="h5" sx={{ mt: 2 }}>{statistics.new}</Typography>
                  <Typography variant="body2" color="text.secondary">Новые</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs:12, sm:6, md: 3}}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => setTabValue(2)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <StartIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Typography variant="h5" sx={{ mt: 2 }}>
                    {statistics.assigned + statistics.inReview}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">В работе</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs:12, sm:6, md: 3}}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => setTabValue(3)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckIcon sx={{ fontSize: 40, color: 'success.main' }} />
                  <Typography variant="h5" sx={{ mt: 2 }}>{statistics.resolved}</Typography>
                  <Typography variant="body2" color="text.secondary">Решено</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{xs:12, sm:6, md: 3}}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <ChartIcon sx={{ fontSize: 40, color: 'info.main' }} />
                  <Typography variant="h5" sx={{ mt: 2 }}>{statistics.avgResolutionTime}ч</Typography>
                  <Typography variant="body2" color="text.secondary">Ср. время решения</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Распределение по критичности */}
        {statistics && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Распределение по критичности
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs:3}}>
                <Chip
                  label={`Критично: ${statistics.bySeverity.critical}`}
                  color="error"
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid size={{xs:3}}>
                <Chip
                  label={`Высокий: ${statistics.bySeverity.high}`}
                  color="warning"
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid size={{xs:3}}>
                <Chip
                  label={`Средний: ${statistics.bySeverity.medium}`}
                  color="info"
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid size={{xs:3}}>
                <Chip
                  label={`Низкий: ${statistics.bySeverity.low}`}
                  color="success"
                  size="small"
                  sx={{ width: '100%' }}
                />
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* Фильтры */}
        <Collapse in={filterOpen}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Фильтры
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{xs:12, md: 3}}>
                <FormControl fullWidth size="small">
                  <InputLabel>Критичность</InputLabel>
                  <Select
                    multiple
                    value={filters.severity || []}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value as IncidentSeverity[] })}
                    label="Критичность"
                  >
                    <MenuItem value="CRITICAL">Критичный</MenuItem>
                    <MenuItem value="HIGH">Высокий</MenuItem>
                    <MenuItem value="MEDIUM">Средний</MenuItem>
                    <MenuItem value="LOW">Низкий</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{xs:12, md: 3}}>
                <FormControl fullWidth size="small">
                  <InputLabel>Категория</InputLabel>
                  <Select
                    multiple
                    value={filters.category || []}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value as IncidentCategory[] })}
                    label="Категория"
                  >
                    <MenuItem value="FINANCIAL">Финансы</MenuItem>
                    <MenuItem value="VENDOR">Контрагенты</MenuItem>
                    <MenuItem value="COMPLIANCE">Комплаенс</MenuItem>
                    <MenuItem value="LOGISTICS">Логистика</MenuItem>
                    <MenuItem value="DATA_QUALITY">Качество данных</MenuItem>
                    <MenuItem value="ETHICS">Этика</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{xs:12, md: 3}}>
                <TextField
                  fullWidth
                  size="small"
                  label="Дата от"
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{xs:12, md: 3}}>
                <TextField
                  fullWidth
                  size="small"
                  label="Дата до"
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => {
                  setFilters({});
                  loadIncidents();
                }}
              >
                Сбросить
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={() => loadIncidents()}
              >
                Применить
              </Button>
            </Box>
          </Paper>
        </Collapse>

        {/* Поиск */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Поиск по объекту риска, описанию и категории..."
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

        {/* Табы */}
        <Paper>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label={`Новые (${newIncidents.length})`} />
            <Tab label={`Начатые (${startedIncidents.length})`} />
            <Tab label={`В работе (${inProgressIncidents.length})`} />
            <Tab label={`Решенные (${resolvedIncidents.length})`} />
          </Tabs>

          {/* Вкладка "Новые" */}
          <TabPanel value={tabValue} index={0}>
            {selectedIncidents.length > 0 && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Выбрано инцидентов: {selectedIncidents.length}. 
                Вы можете объединить их в случай для расследования.
              </Alert>
            )}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIncidents.length === newIncidents.length && newIncidents.length > 0}
                        indeterminate={selectedIncidents.length > 0 && selectedIncidents.length < newIncidents.length}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>№</TableCell>
                    <TableCell>Объект риска</TableCell>
                    <TableCell>Описание инцидента</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Обнаружен</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {newIncidents.map((incident, index) => (
                    <TableRow key={incident.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIncidents.includes(incident.id)}
                          onChange={() => handleSelectIncident(incident.id)}
                        />
                      </TableCell>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {incident.riskObjectName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getIncidentDescription(incident)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryDisplay(incident)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={incident.severity}
                          color={getSeverityColor(incident.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(incident.detectedAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenIncident(incident)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Взять в работу">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleAssignToMe(incident.id)}
                          >
                            <StartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {newIncidents.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Нет новых инцидентов
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Вкладка "Начатые" */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
                    <TableCell>Объект риска</TableCell>
                    <TableCell>Описание инцидента</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Обнаружен</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {startedIncidents.map((incident, index) => (
                    <TableRow key={incident.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {incident.riskObjectName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getIncidentDescription(incident)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryDisplay(incident)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={incident.severity}
                          color={getSeverityColor(incident.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(incident.status)}
                          color={getStatusColor(incident.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(incident.detectedAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenIncident(incident)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Решить">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenResolveDialog(incident)}
                          >
                            <ResolveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {startedIncidents.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <InfoIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Нет начатых инцидентов
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Вкладка "В работе" */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
                    <TableCell>Объект риска</TableCell>
                    <TableCell>Описание инцидента</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Обнаружен</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inProgressIncidents.map((incident, index) => (
                    <TableRow key={incident.id} hover>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {incident.riskObjectName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getIncidentDescription(incident)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryDisplay(incident)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={incident.severity}
                          color={getSeverityColor(incident.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(incident.status)}
                          color={getStatusColor(incident.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(incident.detectedAt).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenIncident(incident)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Решить">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleOpenResolveDialog(incident)}
                          >
                            <ResolveIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {inProgressIncidents.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <InfoIcon sx={{ fontSize: 64, color: 'info.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Нет инцидентов в работе
                </Typography>
              </Box>
            )}
          </TabPanel>

          {/* Вкладка "Решенные" */}
          <TabPanel value={tabValue} index={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>№</TableCell>
                    <TableCell>Объект риска</TableCell>
                    <TableCell>Описание инцидента</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Решен</TableCell>
                    <TableCell>Связанный случай</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {resolvedIncidents.map((incident, index) => (
                    <TableRow key={incident.id} hover sx={{ opacity: 0.8 }}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {incident.riskObjectName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {getIncidentDescription(incident)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryDisplay(incident)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(incident.status)}
                          color={getStatusColor(incident.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {incident.resolvedAt 
                          ? new Date(incident.resolvedAt).toLocaleString('ru-RU')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {incident.caseId ? (
                          <Chip
                            label={incident.caseTitle || incident.caseId}
                            size="small"
                            icon={<CaseIcon />}
                            onClick={() => navigate('/manager/cases')}
                            sx={{ cursor: 'pointer' }}
                          />
                        ) : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenIncident(incident)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {resolvedIncidents.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <InfoIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Нет решенных инцидентов
                </Typography>
              </Box>
            )}
          </TabPanel>
        </Paper>

        {/* Диалог просмотра инцидента */}
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedIncident && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{selectedIncident.riskObjectName || selectedIncident.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {selectedIncident.id}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={selectedIncident.severity}
                      color={getSeverityColor(selectedIncident.severity)}
                      size="small"
                    />
                    <Chip
                      label={getStatusLabel(selectedIncident.status)}
                      color={getStatusColor(selectedIncident.status)}
                      size="small"
                    />
                    <IconButton onClick={handleCloseViewDialog} size="small">
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Категория</Typography>
                    <Typography variant="body2">{getCategoryDisplay(selectedIncident)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Дата обнаружения</Typography>
                    <Typography variant="body2">
                      {new Date(selectedIncident.detectedAt).toLocaleString('ru-RU')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Интеграция</Typography>
                    <Typography variant="body2">
                      {stringifyCategoryValue(incidentViewData?.integrationName)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">ID документа</Typography>
                    <Typography variant="body2">
                      {stringifyCategoryValue(incidentViewData?.documentId)}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" gutterBottom>
                  Обнаруженные риски
                </Typography>

                {incidentViewLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} />
                  </Box>
                )}

                {!incidentViewLoading && findingSlides.length === 0 && (
                  <Alert severity="info">По этому инциденту не найдены findings.</Alert>
                )}

                {!incidentViewLoading && activeFindingSlide && (
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          Сработало правило {activeFindingIndex + 1} из {findingSlides.length}
                        </Typography>
                        <Chip label={activeFindingSlide.findingId} size="small" variant="outlined" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Название правила</Typography>
                        <Typography variant="body2">{activeFindingSlide.rule?.name || '-'}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Условие</Typography>
                        <Typography variant="body2">{activeFindingSlide.rule?.condition || '-'}</Typography>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Приоритет</Typography>
                          <Typography variant="body2">
                            {getPriorityLabel(activeFindingSlide.rule?.priority)}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary">Ответственный</Typography>
                          <Typography variant="body2">{activeFindingSlide.responsibleUserName}</Typography>
                        </Grid>
                      </Grid>
                      {(activeFindingSlide.details.title ||
                        activeFindingSlide.details.severity ||
                        activeFindingSlide.details.description ||
                        activeFindingSlide.details.recommendation) && (
                        <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                          <Stack spacing={1}>
                            {activeFindingSlide.details.title && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Заголовок</Typography>
                                <Typography variant="body2">{activeFindingSlide.details.title}</Typography>
                              </Box>
                            )}
                            {activeFindingSlide.details.severity && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Критичность риска</Typography>
                                <Typography variant="body2">
                                  {getSeverityLabel(activeFindingSlide.details.severity)}
                                </Typography>
                              </Box>
                            )}
                            {activeFindingSlide.details.description && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Описание</Typography>
                                <Typography variant="body2">{activeFindingSlide.details.description}</Typography>
                              </Box>
                            )}
                            {activeFindingSlide.details.recommendation && (
                              <Box>
                                <Typography variant="caption" color="text.secondary">Рекомендация</Typography>
                                <Typography variant="body2">{activeFindingSlide.details.recommendation}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      )}
                    </Stack>
                    {findingSlides.length > 1 && (
                      <MobileStepper
                        variant="dots"
                        steps={findingSlides.length}
                        position="static"
                        activeStep={activeFindingIndex}
                        sx={{ mt: 2, px: 0 }}
                        nextButton={
                          <Button
                            size="small"
                            onClick={() => setActiveFindingIndex((prev) => Math.min(prev + 1, findingSlides.length - 1))}
                            disabled={activeFindingIndex >= findingSlides.length - 1}
                          >
                            <NavigateNextIcon />
                          </Button>
                        }
                        backButton={
                          <Button
                            size="small"
                            onClick={() => setActiveFindingIndex((prev) => Math.max(prev - 1, 0))}
                            disabled={activeFindingIndex === 0}
                          >
                            <NavigateBeforeIcon />
                          </Button>
                        }
                      />
                    )}
                  </Paper>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleCloseViewDialog}>
                  Закрыть
                </Button>
                {(selectedIncident.status === 'NEW' ||
                  shouldShowAssignToMeForPartlyProgress(selectedIncident, authStore.user?.id)) && (
                  <Button
                    variant="outlined"
                    onClick={() => handleAssignToMe(selectedIncident.id)}
                    startIcon={<StartIcon />}
                  >
                    Взять в работу
                  </Button>
                )}
                {(selectedIncident.status === 'ASSIGNED' ||
                  selectedIncident.status === 'IN_REVIEW' ||
                  (selectedIncident.status === 'PARTLY_PROGRESS' &&
                    !!authStore.user?.id &&
                    (selectedIncident.employees ?? []).some((e) => e.userId === authStore.user.id))) && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleCloseViewDialog();
                      handleOpenResolveDialog(selectedIncident);
                    }}
                    startIcon={<ResolveIcon />}
                    color="success"
                  >
                    Решить инцидент
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог решения инцидента */}
        <Dialog
          open={resolveDialogOpen}
          onClose={() => setResolveDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Решение инцидента
          </DialogTitle>
          <DialogContent>
            {selectedIncident && (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    {selectedIncident.title}
                  </Typography>
                </Alert>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Тип решения</InputLabel>
                  <Select
                    value={resolutionType}
                    onChange={(e) => setResolutionType(e.target.value as 'resolved' | 'false_positive')}
                    label="Тип решения"
                  >
                    <MenuItem value="resolved">Проблема решена</MenuItem>
                    <MenuItem value="false_positive">Ложное срабатывание</MenuItem>
                  </Select>
                </FormControl>

                {resolutionType === 'resolved' ? (
                  <TextField
                    fullWidth
                    label="Заметки по решению"
                    multiline
                    rows={4}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Опишите, как была решена проблема..."
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Причина ложного срабатывания"
                    multiline
                    rows={4}
                    value={falsePositiveReason}
                    onChange={(e) => setFalsePositiveReason(e.target.value)}
                    placeholder="Объясните, почему это ложное срабатывание..."
                  />
                )}
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setResolveDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleResolveIncident}
              disabled={resolutionType === 'resolved' ? !resolutionNotes.trim() : !falsePositiveReason.trim()}
              color="success"
            >
              Решить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог создания случая из инцидентов */}
        <Dialog
          open={createCaseDialogOpen}
          onClose={() => setCreateCaseDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Создание случая из инцидентов
          </DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Выбрано инцидентов: {selectedIncidents.length}. 
                Они будут объединены в один случай для комплексного расследования.
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Название случая"
              value={caseTitle}
              onChange={(e) => setCaseTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Описание случая"
              multiline
              rows={6}
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              sx={{ mb: 2 }}
            />

            <Grid container spacing={2}>
              <Grid size={{xs:6}}>
                <FormControl fullWidth>
                  <InputLabel>Критичность</InputLabel>
                  <Select
                    value={caseSeverity}
                    onChange={(e) => setCaseSeverity(e.target.value as any)}
                    label="Критичность"
                  >
                    <MenuItem value="LOW">Низкая</MenuItem>
                    <MenuItem value="MEDIUM">Средняя</MenuItem>
                    <MenuItem value="HIGH">Высокая</MenuItem>
                    <MenuItem value="CRITICAL">Критичная</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{xs:6}}>
                <FormControl fullWidth>
                  <InputLabel>Приоритет</InputLabel>
                  <Select
                    value={casePriority}
                    onChange={(e) => setCasePriority(e.target.value as any)}
                    label="Приоритет"
                  >
                    <MenuItem value="LOW">Низкий</MenuItem>
                    <MenuItem value="NORMAL">Нормальный</MenuItem>
                    <MenuItem value="HIGH">Высокий</MenuItem>
                    <MenuItem value="URGENT">Срочный</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateCaseDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCase}
              disabled={!caseTitle.trim() || !caseDescription.trim()}
              startIcon={<CaseIcon />}
            >
              Создать случай
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
});
