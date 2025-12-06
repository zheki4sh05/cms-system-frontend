// src/pages/supervisor/DashboardPage/DashboardPage.tsx

import { type FC, useEffect, useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Info as InfoIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { SupervisorApi } from '@shared/lib/api/supervisorApi';
import type {
  SupervisorDashboardStats,
  TeamKPI,
  VerificationQueue,
  ProblemArea,
  RuleEffectiveness,
  FinancialImpact,
  CategoryDistribution,
} from '@shared/types/supervisorTypes';

export const SupervisorDashboardPage: FC = observer(() => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SupervisorDashboardStats | null>(null);
  const [teamKPI, setTeamKPI] = useState<TeamKPI[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationQueue[]>([]);
  const [problemAreas, setProblemAreas] = useState<ProblemArea[]>([]);
  const [ruleEffectiveness, setRuleEffectiveness] = useState<RuleEffectiveness[]>([]);
  const [financialImpact, setFinancialImpact] = useState<FinancialImpact | null>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  
  // Диалоги
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<VerificationQueue | null>(null);
  const [verificationComments, setVerificationComments] = useState('');
  
  const [problemDialogOpen, setProblemDialogOpen] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<ProblemArea | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        teamData,
        queueData,
        problemsData,
        rulesData,
        financialData,
        categoriesData,
      ] = await Promise.all([
        SupervisorApi.getDashboardStats(),
        SupervisorApi.getTeamKPI(),
        SupervisorApi.getVerificationQueue(),
        SupervisorApi.getProblemAreas(),
        SupervisorApi.getRuleEffectiveness(),
        SupervisorApi.getFinancialImpact(),
        SupervisorApi.getCategoryDistribution(),
      ]);
      
      setStats(statsData);
      setTeamKPI(teamData);
      setVerificationQueue(queueData);
      setProblemAreas(problemsData);
      setRuleEffectiveness(rulesData);
      setFinancialImpact(financialData);
      setCategoryDistribution(categoriesData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenVerification = (item: VerificationQueue) => {
    setSelectedVerification(item);
    setVerificationDialogOpen(true);
  };

  const handleProcessVerification = async (approved: boolean) => {
    if (!selectedVerification) return;
    
    try {
      await SupervisorApi.processVerification(selectedVerification.id, {
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

  const handleExportReport = async (format: 'pdf' | 'excel') => {
    try {
      const blob = await SupervisorApi.exportReport(format, 'current_month');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUpIcon color="error" fontSize="small" />;
    if (trend < 0) return <TrendingDownIcon color="success" fontSize="small" />;
    return <TrendingFlatIcon color="disabled" fontSize="small" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'error';
      case 'HIGH': return 'warning';
      case 'NORMAL': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
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
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('pdf')}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('excel')}
            >
              Excel
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
                <List>
                  {teamKPI.map((member, index) => (
                    <Box key={member.managerId}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Badge
                            badgeContent={member.rank}
                            color={member.rank <= 3 ? 'primary' : 'default'}
                            overlap="circular"
                          >
                            <Avatar src={member.avatar}>
                              {member.managerName.charAt(0)}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1" fontWeight="medium">
                                {member.managerName}
                              </Typography>
                              {member.rank === 1 && <StarIcon sx={{ fontSize: 16, color: 'gold' }} />}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                Инциденты: {member.resolvedIncidents}/{member.assignedIncidents} • 
                                Случаи: {member.completedCases}/{member.activeCases}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Chip
                                  label={`${member.performanceScore}`}
                                  size="small"
                                  color={getPerformanceColor(member.performanceScore)}
                                />
                                <Typography variant="caption" color="text.secondary">
                                  {member.avgResolutionTime}ч • {member.onTimeCompletion}% в срок
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant="determinate"
                                value={member.performanceScore}
                                color={getPerformanceColor(member.performanceScore)}
                                sx={{ mt: 1, height: 6, borderRadius: 1 }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < teamKPI.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Средняя колонка - Очередь верификации + Финансовое влияние */}
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
                        <Box key={item.id}>
                          <ListItem
                            sx={{
                              px: 0,
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                            onClick={() => handleOpenVerification(item)}
                          >
                            <ListItemIcon>
                              {item.type === 'ACTION_PLAN' ? (
                                <AssessmentIcon color="primary" />
                              ) : (
                                <CheckIcon color="success" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="body2" fontWeight="medium">
                                    {item.title}
                                  </Typography>
                                  <Chip
                                    label={item.priority}
                                    size="small"
                                    color={getPriorityColor(item.priority)}
                                  />
                                </Box>
                              }
                              secondary={
                                <>
                                  <Typography variant="caption" display="block">
                                    От: {item.submittedByName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(item.submittedAt).toLocaleString('ru-RU')} • 
                                    ~{item.estimatedReviewTime} мин
                                  </Typography>
                                </>
                              }
                            />
                            <IconButton size="small" color="primary">
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

              {/* Финансовое влияние */}
              {financialImpact && (
                <Card>
                  <CardHeader
                    title="Финансовое влияние"
                    avatar={<MoneyIcon color="success" />}
                    subheader={financialImpact.period}
                  />
                  <Divider />
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid size={{xs:6}}>
                        <Typography variant="caption" color="text.secondary">
                          Выявлено нарушений
                        </Typography>
                        <Typography variant="h6" color="error.main">
                          {financialImpact.detectedViolationsAmount.toLocaleString('ru-RU')} ₽
                        </Typography>
                      </Grid>
                      <Grid size={{xs:6}}>
                        <Typography variant="caption" color="text.secondary">
                          Предотвращено убытков
                        </Typography>
                        <Typography variant="h6" color="success.main">
                          {financialImpact.preventedLosses.toLocaleString('ru-RU')} ₽
                        </Typography>
                      </Grid>
                      <Grid size={{xs:6}}>
                        <Divider sx={{ my: 1 }} />
                      </Grid>
                      <Grid size={{xs:6}}>
                        <Typography variant="caption" color="text.secondary">
                          Затраты на систему
                        </Typography>
                        <Typography variant="body1">
                          {financialImpact.systemCosts.toLocaleString('ru-RU')} ₽
                        </Typography>
                      </Grid>
                      <Grid size={{xs:6}}>
                        <Typography variant="caption" color="text.secondary">
                          ROI системы
                        </Typography>
                        <Typography variant="h6" color="success.main" fontWeight="bold">
                          {financialImpact.roi}%
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        Распределение по категориям
                      </Typography>
                      {financialImpact.byCategory.map((cat) => (
                        <Box key={cat.category} sx={{ mb: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption">{cat.category}</Typography>
                            <Typography variant="caption" fontWeight="bold">
                              {cat.amount.toLocaleString('ru-RU')} ₽ ({cat.percentage}%)
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={cat.percentage}
                            sx={{ height: 6, borderRadius: 1 }}
                          />
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Правая колонка - Проблемные зоны */}
          <Grid size={{xs:12, lg:4}}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Проблемные зоны"
                avatar={<ErrorIcon color="error" />}
                action={
                  <Chip
                    label={`${problemAreas.filter(p => p.severity === 'CRITICAL' || p.severity === 'HIGH').length} критичных`}
                    size="small"
                    color="error"
                  />
                }
              />
              <Divider />
              <CardContent sx={{ maxHeight: 600, overflow: 'auto' }}>
                {problemAreas.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CheckIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Критичных проблем не обнаружено
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {problemAreas.map((problem) => (
                      <Card
                        key={problem.id}
                        variant="outlined"
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { boxShadow: 2 },
                          borderLeft: 4,
                          borderLeftColor: `${getSeverityColor(problem.severity)}.main`,
                        }}
                        onClick={() => {
                          setSelectedProblem(problem);
                          setProblemDialogOpen(true);
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography variant="body1" fontWeight="medium">
                              {problem.title}
                            </Typography>
                            <Chip
                              label={problem.severity}
                              size="small"
                              color={getSeverityColor(problem.severity)}
                            />
                          </Box>

                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            {problem.category}
                          </Typography>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {problem.description}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                            <Tooltip title="Затронутые инциденты">
                              <Chip
                                label={`${problem.affectedIncidents} инц.`}
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                            <Tooltip title="Затронутые случаи">
                              <Chip
                                label={`${problem.affectedCases} случаев`}
                                size="small"
                                variant="outlined"
                              />
                            </Tooltip>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              Тренд:
                            </Typography>
                            {problem.trend === 'WORSENING' && (
                              <>
                                <TrendingUpIcon color="error" fontSize="small" />
                                <Typography variant="caption" color="error">
                                  Ухудшается ({problem.trendPercentage}%)
                                </Typography>
                              </>
                            )}
                            {problem.trend === 'IMPROVING' && (
                              <>
                                <TrendingDownIcon color="success" fontSize="small" />
                                <Typography variant="caption" color="success.main">
                                  Улучшается ({problem.trendPercentage}%)
                                </Typography>
                              </>
                            )}
                            {problem.trend === 'STABLE' && (
                              <>
                                <TrendingFlatIcon color="disabled" fontSize="small" />
                                <Typography variant="caption" color="text.secondary">
                                  Стабильно
                                </Typography>
                              </>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Нижняя секция - Эффективность правил и категории */}
        <Grid container spacing={3} sx={{ mt: 0 }}>
          {/* Эффективность правил */}
          <Grid size={{xs:12, lg:8}}>
            <Card>
              <CardHeader
                title="Эффективность правил"
                avatar={<ShieldIcon color="primary" />}
                subheader="Анализ точности срабатывания правил"
              />
              <Divider />
              <CardContent>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Правило</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell align="center">Срабатываний</TableCell>
                        <TableCell align="center">Точность</TableCell>
                        <TableCell align="center">Ср. время</TableCell>
                        <TableCell>Статус</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ruleEffectiveness.map((rule) => (
                        <TableRow key={rule.ruleId} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {rule.ruleName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={rule.category} size="small" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {rule.totalTriggers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {rule.truePositives} / {rule.falsePositives}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                              <Typography
                                variant="body2"
                                fontWeight="bold"
                                color={rule.accuracy >= 80 ? 'success.main' : rule.accuracy >= 60 ? 'warning.main' : 'error.main'}
                              >
                                {rule.accuracy}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={rule.accuracy}
                              color={rule.accuracy >= 80 ? 'success' : rule.accuracy >= 60 ? 'warning' : 'error'}
                              sx={{ width: 60, height: 4, borderRadius: 1, mx: 'auto', mt: 0.5 }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">
                              {rule.avgResolutionTime}ч
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={rule.status === 'ACTIVE' ? 'Активно' : rule.status === 'DISABLED' ? 'Отключено' : 'На проверке'}
                              size="small"
                              color={rule.status === 'ACTIVE' ? 'success' : rule.status === 'DISABLED' ? 'default' : 'warning'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Распределение по категориям */}
          <Grid size={{xs:12, lg:4}}>
            <Card sx={{ height: '100%' }}>
              <CardHeader
                title="Распределение по категориям"
                avatar={<AssessmentIcon color="info" />}
              />
              <Divider />
              <CardContent>
                <Stack spacing={2}>
                  {categoryDistribution.map((cat) => (
                    <Box key={cat.category}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="body2">{cat.category}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight="bold">
                            {cat.count}
                          </Typography>
                          {getTrendIcon(cat.trend)}
                          <Typography variant="caption" color="text.secondary">
                            {Math.abs(cat.trend)}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={cat.percentage}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>
                          {cat.percentage}%
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Stack>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Верификация</Typography>
                  <Chip
                    label={selectedVerification.type === 'ACTION_PLAN' ? 'План действий' : 'Закрытие случая'}
                    color="primary"
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>От:</strong> {selectedVerification.submittedByName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Дата:</strong> {new Date(selectedVerification.submittedAt).toLocaleString('ru-RU')}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Приоритет:</strong> {selectedVerification.priority}
                  </Typography>
                </Alert>

                <Typography variant="h6" gutterBottom>
                  {selectedVerification.title}
                </Typography>

                {selectedVerification.taskCount && (
                  <Box sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Прогресс выполнения задач
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(selectedVerification.completedTasks! / selectedVerification.taskCount) * 100}
                        sx={{ flexGrow: 1, height: 8, borderRadius: 1 }}
                      />
                      <Typography variant="body2">
                        {selectedVerification.completedTasks}/{selectedVerification.taskCount}
                      </Typography>
                    </Box>
                  </Box>
                )}

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
          maxWidth="sm"
          fullWidth
        >
          {selectedProblem && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedProblem.title}</Typography>
                  <Chip
                    label={selectedProblem.severity}
                    color={getSeverityColor(selectedProblem.severity)}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Typography variant="body2" paragraph>
                  {selectedProblem.description}
                </Typography>

                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Влияние:</strong> {selectedProblem.estimatedImpact}
                  </Typography>
                </Alert>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                  Рекомендации:
                </Typography>
                <List dense>
                  {selectedProblem.recommendations.map((rec, index) => (
                    <ListItem key={index}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <InfoIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={rec} />
                    </ListItem>
                  ))}
                </List>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setProblemDialogOpen(false)}>
                  Закрыть
                </Button>
                <Button variant="contained">
                  Создать задачу
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
});
