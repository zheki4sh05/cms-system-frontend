// src/pages/supervisor/IncidentsPage/IncidentsPage.tsx

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
  Tooltip,
  Badge,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Checkbox,
  AvatarGroup,
  ListItemIcon,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  SwapHoriz as ReassignIcon,
  TrendingUp as EscalateIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  People as PeopleIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterIcon,
  ArrowUpward as ArrowUpIcon,
  Person as PersonIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { IncidentApi } from '@shared/lib/api/incidentApi';
import type {
  Incident,
  IncidentStatus,
  IncidentSeverity,
  IncidentCategory,
  IncidentStatistics,
  ManagerWorkload,
  IncidentDistribution,
  ReassignIncidentRequest,
  EscalateIncidentRequest,
  IncidentAssignment,
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

export const SupervisorIncidentsPage: FC = observer(() => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [statistics, setStatistics] = useState<IncidentStatistics | null>(null);
  const [managersWorkload, setManagersWorkload] = useState<ManagerWorkload[]>([]);
  const [distribution, setDistribution] = useState<IncidentDistribution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Фильтры
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterManager, setFilterManager] = useState<string>('all');
  
  // Диалоги
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [reassignDialogOpen, setReassignDialogOpen] = useState(false);
  const [escalateDialogOpen, setEscalateDialogOpen] = useState(false);
  const [workloadDialogOpen, setWorkloadDialogOpen] = useState(false);
  
  // Выбранный инцидент
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [assignmentHistory, setAssignmentHistory] = useState<IncidentAssignment[]>([]);
  
  // Форма переназначения
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [reassignReason, setReassignReason] = useState('');
  const [notifyManager, setNotifyManager] = useState(true);
  
  // Форма эскалации
  const [escalateReason, setEscalateReason] = useState('');
  const [escalateUrgency, setEscalateUrgency] = useState<'HIGH' | 'CRITICAL'>('HIGH');
  const [requiresImmediateAction, setRequiresImmediateAction] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [
        incidentsData,
        statsData,
        workloadData,
        distributionData,
      ] = await Promise.all([
        IncidentApi.getMyIncidents(),
        IncidentApi.getIncidentStatistics(),
        IncidentApi.getManagersWorkload(),
        IncidentApi.getIncidentDistribution(),
      ]);
      
      setIncidents(incidentsData);
      setStatistics(statsData);
      setManagersWorkload(workloadData);
      setDistribution(distributionData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenIncident = async (incident: Incident) => {
    setSelectedIncident(incident);
    setViewDialogOpen(true);
    
    try {
      const history = await IncidentApi.getIncidentAssignmentHistory(incident.id);
      setAssignmentHistory(history);
    } catch (error) {
      console.error('Failed to load assignment history:', error);
    }
  };

  const handleOpenReassign = (incident: Incident) => {
    setSelectedIncident(incident);
    setReassignDialogOpen(true);
  };

  const handleReassignIncident = async () => {
    if (!selectedIncident || !selectedManagerId) return;
    
    try {
      const request: ReassignIncidentRequest = {
        toManagerId: selectedManagerId,
        reason: reassignReason,
        notifyManager,
      };
      
      await IncidentApi.reassignIncident(selectedIncident.id, request);
      await loadData();
      
      setReassignDialogOpen(false);
      resetReassignForm();
    } catch (error) {
      console.error('Failed to reassign incident:', error);
    }
  };

  const handleOpenEscalate = (incident: Incident) => {
    setSelectedIncident(incident);
    setEscalateDialogOpen(true);
  };

  const handleEscalateIncident = async () => {
    if (!selectedIncident) return;
    
    try {
      const request: EscalateIncidentRequest = {
        reason: escalateReason,
        urgency: escalateUrgency,
        requiresImmediateAction,
      };
      
      await IncidentApi.escalateIncident(selectedIncident.id, request);
      await loadData();
      
      setEscalateDialogOpen(false);
      resetEscalateForm();
    } catch (error) {
      console.error('Failed to escalate incident:', error);
    }
  };

  const resetReassignForm = () => {
    setSelectedIncident(null);
    setSelectedManagerId('');
    setReassignReason('');
    setNotifyManager(true);
  };

  const resetEscalateForm = () => {
    setSelectedIncident(null);
    setEscalateReason('');
    setEscalateUrgency('HIGH');
    setRequiresImmediateAction(false);
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
      case 'IN_REVIEW': return 'info';
      case 'RESOLVED': return 'success';
      case 'FALSE_POSITIVE': return 'default';
      case 'ESCALATED_TO_CASE': return 'secondary';
    }
  };

  const getStatusLabel = (status: IncidentStatus) => {
    const labels = {
      NEW: 'Новый',
      ASSIGNED: 'Назначен',
      IN_REVIEW: 'На проверке',
      RESOLVED: 'Решен',
      FALSE_POSITIVE: 'Ложное срабатывание',
      ESCALATED_TO_CASE: 'Эскалирован в случай',
    };
    return labels[status];
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

  const getWorkloadStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'success';
      case 'BUSY': return 'warning';
      case 'OVERLOADED': return 'error';
      default: return 'default';
    }
  };

  const getWorkloadStatusLabel = (status: 'AVAILABLE' | 'BUSY' | 'OVERLOADED') => {
    const labels = {
      AVAILABLE: 'Доступен',
      BUSY: 'Занят',
      OVERLOADED: 'Перегружен',
    };
    return labels[status] || status;
  };

  const filteredIncidents = incidents.filter(i => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!(i.title.toLowerCase().includes(query) ||
            i.description.toLowerCase().includes(query) ||
            i.id.toLowerCase().includes(query) ||
            i.ruleName.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    if (filterSeverity !== 'all' && i.severity !== filterSeverity) {
      return false;
    }
    
    if (filterCategory !== 'all' && i.category !== filterCategory) {
      return false;
    }
    
    if (filterManager !== 'all' && i.assignedTo !== filterManager) {
      return false;
    }
    
    return true;
  });

  const criticalIncidents = filteredIncidents.filter(i => i.severity === 'CRITICAL' && i.status === 'NEW');
  const activeIncidents = filteredIncidents.filter(i => i.status === 'ASSIGNED' || i.status === 'IN_REVIEW');
  const allIncidents = filteredIncidents;

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
              Управление инцидентами
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Контроль нагрузки команды и эскалация критичных случаев
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={() => setWorkloadDialogOpen(true)}
          >
            Нагрузка команды
          </Button>
        </Box>

        {/* Статистика и распределение */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Статистика инцидентов */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Статистика инцидентов
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="error.main">
                        {statistics?.bySeverity.critical || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Критичные
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="warning.main">
                        {statistics?.new || 0}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Новые
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4" color="primary.main">
                        {(statistics?.assigned || 0) + (statistics?.inReview || 0)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        В работе
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h4">
                        {statistics?.avgResolutionTime || 0}ч
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Ср. время
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Распределение по менеджерам */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>
                Распределение нагрузки
              </Typography>
              <List dense>
                {distribution.slice(0, 4).map((item) => (
                  <ListItem key={item.managerId} sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {item.managerName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={item.managerName}
                      secondary={
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={item.percentage}
                            sx={{ mt: 0.5, height: 6, borderRadius: 1 }}
                          />
                          <Typography variant="caption">
                            {item.count} инцидентов ({item.percentage}%)
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Фильтры */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Поиск инцидентов..."
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
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Критичность</InputLabel>
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  label="Критичность"
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="CRITICAL">Критичный</MenuItem>
                  <MenuItem value="HIGH">Высокий</MenuItem>
                  <MenuItem value="MEDIUM">Средний</MenuItem>
                  <MenuItem value="LOW">Низкий</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Категория</InputLabel>
                <Select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  label="Категория"
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="FINANCIAL">Финансы</MenuItem>
                  <MenuItem value="COMPLIANCE">Комплаенс</MenuItem>
                  <MenuItem value="LOGISTICS">Логистика</MenuItem>
                  <MenuItem value="ETHICS">Этика</MenuItem>
                  <MenuItem value="DATA_QUALITY">Качество данных</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Менеджер</InputLabel>
                <Select
                  value={filterManager}
                  onChange={(e) => setFilterManager(e.target.value)}
                  label="Менеджер"
                >
                  <MenuItem value="all">Все менеджеры</MenuItem>
                  {managersWorkload.map((manager) => (
                    <MenuItem key={manager.managerId} value={manager.managerId}>
                      {manager.managerName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setFilterSeverity('all');
                  setFilterCategory('all');
                  setFilterManager('all');
                  setSearchQuery('');
                }}
              >
                Сбросить
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Табы */}
        <Paper>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              label={
                <Badge badgeContent={criticalIncidents.length} color="error">
                  <Box sx={{ px: 1 }}>Критичные ({criticalIncidents.length})</Box>
                </Badge>
              }
            />
            <Tab label={`В работе (${activeIncidents.length})`} />
            <Tab label={`Все инциденты (${allIncidents.length})`} />
          </Tabs>

          {/* Вкладка "Критичные" */}
          <TabPanel value={tabValue} index={0}>
            {criticalIncidents.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Нет критичных инцидентов
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Название</TableCell>
                      <TableCell>Правило</TableCell>
                      <TableCell>Ответственный</TableCell>
                      <TableCell>Обнаружен</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {criticalIncidents.map((incident) => (
                      <TableRow key={incident.id} hover sx={{ bgcolor: 'error.50' }}>
                        <TableCell>{incident.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ErrorIcon color="error" fontSize="small" />
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {incident.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {incident.description.substring(0, 50)}...
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={incident.ruleName} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 28, height: 28 }}>
                              {incident.assignedToName.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{incident.assignedToName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(incident.detectedAt).toLocaleString('ru-RU')}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Просмотр">
                            <IconButton size="small" onClick={() => handleOpenIncident(incident)}>
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Переназначить">
                            <IconButton size="small" color="primary" onClick={() => handleOpenReassign(incident)}>
                              <ReassignIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Эскалировать">
                            <IconButton size="small" color="error" onClick={() => handleOpenEscalate(incident)}>
                              <EscalateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Вкладка "В работе" */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Ответственный</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeIncidents.map((incident) => (
                    <TableRow key={incident.id} hover>
                      <TableCell>{incident.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {incident.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryLabel(incident.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={incident.severity}
                          color={getSeverityColor(incident.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28 }}>
                            {incident.assignedToName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{incident.assignedToName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(incident.status)}
                          color={getStatusColor(incident.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenIncident(incident)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Переназначить">
                          <IconButton size="small" onClick={() => handleOpenReassign(incident)}>
                            <ReassignIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Вкладка "Все инциденты" */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Ответственный</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Обнаружен</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allIncidents.map((incident) => (
                    <TableRow key={incident.id} hover>
                      <TableCell>{incident.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{incident.title}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryLabel(incident.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={incident.severity}
                          color={getSeverityColor(incident.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{incident.assignedToName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(incident.status)}
                          color={getStatusColor(incident.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(incident.detectedAt).toLocaleDateString('ru-RU')}
                        </Typography>
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
          </TabPanel>
        </Paper>

        {/* Диалог просмотра инцидента (как у менеджера + история переназначений) */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedIncident && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{selectedIncident.title}</Typography>
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
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent>
                <Typography variant="body1" paragraph>
                  {selectedIncident.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Правило</Typography>
                    <Typography variant="body2">{selectedIncident.ruleName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Категория</Typography>
                    <Typography variant="body2">{getCategoryLabel(selectedIncident.category)}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Ответственный</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Avatar sx={{ width: 24, height: 24 }}>
                        {selectedIncident.assignedToName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{selectedIncident.assignedToName}</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Обнаружен</Typography>
                    <Typography variant="body2">
                      {new Date(selectedIncident.detectedAt).toLocaleString('ru-RU')}
                    </Typography>
                  </Grid>
                  {selectedIncident.vendorName && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Поставщик</Typography>
                      <Typography variant="body2">{selectedIncident.vendorName}</Typography>
                    </Grid>
                  )}
                  {selectedIncident.amount && (
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">Сумма</Typography>
                      <Typography variant="body2">
                        {selectedIncident.amount.toLocaleString('ru-RU')} ₽
                      </Typography>
                    </Grid>
                  )}
                </Grid>

                {assignmentHistory.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          История переназначений ({assignmentHistory.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List dense>
                          {assignmentHistory.map((item, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <ReassignIcon fontSize="small" color="primary" />
                              </ListItemIcon>
                              <ListItemText
                                primary={`Переназначено: ${item.fromManagerId} → ${item.toManagerId}`}
                                secondary={
                                  <>
                                    <Typography variant="caption" display="block">
                                      Причина: {item.reason}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {item.reassignedBy} • {new Date(item.reassignedAt).toLocaleString('ru-RU')}
                                    </Typography>
                                  </>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}

                {selectedIncident.payloadJson && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">Исходные данные события</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Paper sx={{ p: 2, bgcolor: 'grey.100', maxHeight: 300, overflow: 'auto' }}>
                          <pre style={{ margin: 0, fontSize: '0.85rem' }}>
                            {JSON.stringify(selectedIncident.payloadJson, null, 2)}
                          </pre>
                        </Paper>
                      </AccordionDetails>
                    </Accordion>
                  </>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setViewDialogOpen(false)}>
                  Закрыть
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ReassignIcon />}
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleOpenReassign(selectedIncident);
                  }}
                >
                  Переназначить
                </Button>
                {selectedIncident.severity === 'CRITICAL' && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<EscalateIcon />}
                    onClick={() => {
                      setViewDialogOpen(false);
                      handleOpenEscalate(selectedIncident);
                    }}
                  >
                    Эскалировать
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог переназначения */}
        <Dialog
          open={reassignDialogOpen}
          onClose={() => setReassignDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedIncident && (
            <>
              <DialogTitle>Переназначение инцидента</DialogTitle>
              <DialogContent>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Инцидент:</strong> {selectedIncident.title}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Текущий ответственный:</strong> {selectedIncident.assignedToName}
                  </Typography>
                </Alert>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Новый ответственный</InputLabel>
                  <Select
                    value={selectedManagerId}
                    onChange={(e) => setSelectedManagerId(e.target.value)}
                    label="Новый ответственный"
                  >
                    {managersWorkload
                      .filter(m => m.managerId !== selectedIncident.assignedTo)
                      .map((manager) => (
                        <MenuItem key={manager.managerId} value={manager.managerId}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {manager.managerName.charAt(0)}
                            </Avatar>
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="body2">{manager.managerName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                Нагрузка: {manager.activeIncidents} активных
                              </Typography>
                            </Box>
                            <Chip
                              label={getWorkloadStatusLabel(manager.status)}
                              size="small"
                              color={getWorkloadStatusColor(manager.status)}
                            />
                          </Box>
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Причина переназначения"
                  multiline
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Укажите причину переназначения..."
                  required
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={notifyManager}
                      onChange={(e) => setNotifyManager(e.target.checked)}
                    />
                  }
                  label="Уведомить менеджера о переназначении"
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setReassignDialogOpen(false)}>
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  onClick={handleReassignIncident}
                  disabled={!selectedManagerId || !reassignReason.trim()}
                  startIcon={<ReassignIcon />}
                >
                  Переназначить
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог эскалации */}
        <Dialog
          open={escalateDialogOpen}
          onClose={() => setEscalateDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          {selectedIncident && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorIcon color="error" />
                  <Typography>Эскалация инцидента топ-менеджменту</Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Alert severity="warning" sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight="medium" gutterBottom>
                    Инцидент будет эскалирован топ-менеджменту компании
                  </Typography>
                  <Typography variant="caption">
                    <strong>Инцидент:</strong> {selectedIncident.title}
                  </Typography>
                  <br />
                  <Typography variant="caption">
                    <strong>Критичность:</strong> {selectedIncident.severity}
                  </Typography>
                </Alert>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Уровень срочности</InputLabel>
                  <Select
                    value={escalateUrgency}
                    onChange={(e) => setEscalateUrgency(e.target.value as 'HIGH' | 'CRITICAL')}
                    label="Уровень срочности"
                  >
                    <MenuItem value="HIGH">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" fontSize="small" />
                        <Typography>Высокая срочность</Typography>
                      </Box>
                    </MenuItem>
                    <MenuItem value="CRITICAL">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ErrorIcon color="error" fontSize="small" />
                        <Typography>Критическая срочность</Typography>
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Причина эскалации"
                  multiline
                  rows={4}
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  placeholder="Детально опишите причину эскалации и требуемые действия от топ-менеджмента..."
                  required
                  sx={{ mb: 2 }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={requiresImmediateAction}
                      onChange={(e) => setRequiresImmediateAction(e.target.checked)}
                    />
                  }
                  label="Требуется немедленное вмешательство"
                />
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setEscalateDialogOpen(false)}>
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleEscalateIncident}
                  disabled={!escalateReason.trim()}
                  startIcon={<ArrowUpIcon />}
                >
                  Эскалировать
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог нагрузки команды */}
        <Dialog
          open={workloadDialogOpen}
          onClose={() => setWorkloadDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon color="primary" />
              <Typography>Нагрузка команды</Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <List>
              {managersWorkload.map((manager) => (
                <Box key={manager.managerId}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar>{manager.managerName.charAt(0)}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight="medium">
                            {manager.managerName}
                          </Typography>
                          <Chip
                            label={getWorkloadStatusLabel(manager.status)}
                            size="small"
                            color={getWorkloadStatusColor(manager.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Назначено инцидентов
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {manager.assignedIncidents}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Активных
                              </Typography>
                              <Typography variant="body2" fontWeight="medium">
                                {manager.activeIncidents}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Ср. время решения
                              </Typography>
                              <Typography variant="body2">{manager.avgResolutionTime}ч</Typography>
                            </Grid>
                            <Grid size={{ xs: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Процент выполнения
                              </Typography>
                              <Typography variant="body2">{manager.completionRate}%</Typography>
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                Загруженность
                              </Typography>
                              <Typography variant="caption" fontWeight="bold">
                                {manager.capacity}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={manager.capacity}
                              color={
                                manager.capacity >= 90 ? 'error' :
                                manager.capacity >= 70 ? 'warning' : 'success'
                              }
                              sx={{ height: 8, borderRadius: 1 }}
                            />
                          </Box>
                          {manager.overdueIncidents > 0 && (
                            <Alert severity="warning" sx={{ mt: 1 }}>
                              <Typography variant="caption">
                                Просроченных инцидентов: {manager.overdueIncidents}
                              </Typography>
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWorkloadDialogOpen(false)}>
              Закрыть
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
});
