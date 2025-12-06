// src/pages/supervisor/AnalyticsPage/AnalyticsPage.tsx

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
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  Assessment as AssessmentIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Shield as ShieldIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { AnalyticsApi } from '@shared/lib/api/analyticApi';
import type {
  AnalyticsPeriod,
  DashboardSummary,
  IncidentTrendData,
  CategoryAnalytics,
  ManagerPerformanceAnalytics,
  RulePerformanceAnalytics,
  FinancialAnalytics,
  ComplianceAnalytics,
  VendorRiskAnalytics,
  ReportExportOptions,
} from '@shared/types/analyticTypes';

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

export const SupervisorAnalyticsPage: FC = observer(() => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  
  // Период
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current_month');
  const [customPeriod, setCustomPeriod] = useState<AnalyticsPeriod>({
    startDate: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    label: 'Текущий месяц',
  });
  
  // Данные
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [incidentTrends, setIncidentTrends] = useState<IncidentTrendData[]>([]);
  const [categoryAnalytics, setCategoryAnalytics] = useState<CategoryAnalytics[]>([]);
  const [managerPerformance, setManagerPerformance] = useState<ManagerPerformanceAnalytics[]>([]);
  const [rulePerformance, setRulePerformance] = useState<RulePerformanceAnalytics[]>([]);
  const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics | null>(null);
  const [complianceAnalytics, setComplianceAnalytics] = useState<ComplianceAnalytics | null>(null);
  const [vendorRiskAnalytics, setVendorRiskAnalytics] = useState<VendorRiskAnalytics[]>([]);
  
  // Экспорт
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [customPeriod]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [
        summaryData,
        trendsData,
        categoriesData,
        managersData,
        rulesData,
        financialData,
        complianceData,
        vendorsData,
      ] = await Promise.all([
        AnalyticsApi.getDashboardSummary(customPeriod),
        AnalyticsApi.getIncidentTrends(customPeriod),
        AnalyticsApi.getCategoryAnalytics(customPeriod),
        AnalyticsApi.getManagerPerformance(customPeriod),
        AnalyticsApi.getRulePerformance(customPeriod),
        AnalyticsApi.getFinancialAnalytics(customPeriod),
        AnalyticsApi.getComplianceAnalytics(customPeriod),
        AnalyticsApi.getVendorRiskAnalytics(customPeriod),
      ]);
      
      setSummary(summaryData);
      setIncidentTrends(trendsData);
      setCategoryAnalytics(categoriesData);
      setManagerPerformance(managersData);
      setRulePerformance(rulesData);
      setFinancialAnalytics(financialData);
      setComplianceAnalytics(complianceData);
      setVendorRiskAnalytics(vendorsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    
    const now = new Date();
    let startDate: Date;
    let endDate = now;
    let label = '';
    
    switch (period) {
      case 'current_week':
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        label = 'Текущая неделя';
        break;
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        label = 'Текущий месяц';
        break;
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        label = 'Текущий квартал';
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        label = 'Текущий год';
        break;
      case 'last_30_days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        label = 'Последние 30 дней';
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        label = 'Текущий месяц';
    }
    
    setCustomPeriod({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      label,
    });
  };

  const handleExportReport = async () => {
    try {
      setExportLoading(true);
      
      const options: ReportExportOptions = {
        period: customPeriod,
        includeCharts: true,
        includeTables: true,
        includeDetails: true,
        sections: [
          'summary',
          'incidents',
          'categories',
          'managers',
          'rules',
          'financial',
          'compliance',
          'vendors',
        ],
      };
      
      const blob = await AnalyticsApi.exportReport(options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${customPeriod.startDate}_${customPeriod.endDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export report:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUpIcon fontSize="small" color="error" />;
    if (trend < 0) return <TrendingDownIcon fontSize="small" color="success" />;
    return <TrendingFlatIcon fontSize="small" color="disabled" />;
  };

  const getTrendColor = (trend: number, inverse: boolean = false) => {
    if (inverse) {
      // Для метрик где уменьшение = хорошо (время решения, ложные срабатывания)
      if (trend > 0) return 'error.main';
      if (trend < 0) return 'success.main';
    } else {
      // Для метрик где увеличение = хорошо (эффективность, точность)
      if (trend > 0) return 'success.main';
      if (trend < 0) return 'error.main';
    }
    return 'text.secondary';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
      default: return 'default';
    }
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
              Аналитика и отчетность
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customPeriod.label} • {customPeriod.startDate} - {customPeriod.endDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Период</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                label="Период"
              >
                <MenuItem value="current_week">Текущая неделя</MenuItem>
                <MenuItem value="current_month">Текущий месяц</MenuItem>
                <MenuItem value="current_quarter">Текущий квартал</MenuItem>
                <MenuItem value="current_year">Текущий год</MenuItem>
                <MenuItem value="last_30_days">Последние 30 дней</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Обновить данные">
              <IconButton onClick={loadAnalytics} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
              onClick={handleExportReport}
              disabled={exportLoading}
            >
              Выгрузить в PDF
            </Button>
          </Box>
        </Box>

        {/* Ключевые метрики */}
        {summary && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Инциденты
                      </Typography>
                      <Typography variant="h4">{summary.totalIncidents}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        {getTrendIcon(summary.incidentsTrend)}
                        <Typography
                          variant="caption"
                          sx={{ color: getTrendColor(summary.incidentsTrend, true) }}
                        >
                          {Math.abs(summary.incidentsTrend)}%
                        </Typography>
                      </Box>
                    </Box>
                    <WarningIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Случаи
                      </Typography>
                      <Typography variant="h4">{summary.totalCases}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        {getTrendIcon(summary.casesTrend)}
                        <Typography
                          variant="caption"
                          sx={{ color: getTrendColor(summary.casesTrend, true) }}
                        >
                          {Math.abs(summary.casesTrend)}%
                        </Typography>
                      </Box>
                    </Box>
                    <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Ср. время решения
                      </Typography>
                      <Typography variant="h4">{summary.avgResolutionTime}ч</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        {getTrendIcon(summary.resolutionTimeTrend)}
                        <Typography
                          variant="caption"
                          sx={{ color: getTrendColor(summary.resolutionTimeTrend, true) }}
                        >
                          {Math.abs(summary.resolutionTimeTrend)}%
                        </Typography>
                      </Box>
                    </Box>
                    <SpeedIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Эффективность системы
                      </Typography>
                      <Typography variant="h4">{summary.systemEfficiency}%</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        {getTrendIcon(summary.efficiencyTrend)}
                        <Typography
                          variant="caption"
                          sx={{ color: getTrendColor(summary.efficiencyTrend) }}
                        >
                          {Math.abs(summary.efficiencyTrend)}%
                        </Typography>
                      </Box>
                    </Box>
                    <CheckIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Табы с дашбордами */}
        <Paper>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Обзор" />
            <Tab label="По категориям" />
            <Tab label="Команда" />
            <Tab label="Правила" />
            <Tab label="Финансы" />
            <Tab label="Комплаенс" />
            <Tab label="Риски поставщиков" />
          </Tabs>

          {/* Вкладка "Обзор" */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              {/* Топ категории */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Топ категории инцидентов
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {summary?.topCategories.map((cat, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemText
                          primary={cat.category}
                          secondary={
                            <Box>
                              <LinearProgress
                                variant="determinate"
                                value={cat.percentage}
                                sx={{ mt: 0.5, mb: 0.5, height: 6, borderRadius: 1 }}
                              />
                              <Typography variant="caption">
                                {cat.count} инцидентов ({cat.percentage}%)
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Топ правила */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Наиболее эффективные правила
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {summary?.topRules.map((rule, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemText
                          primary={rule.ruleName}
                          secondary={
                            <>
                              <Typography variant="caption" display="block">
                                Срабатываний: {rule.triggers}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption">Точность:</Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={rule.accuracy}
                                  sx={{ flexGrow: 1, height: 4, borderRadius: 1 }}
                                  color={rule.accuracy >= 90 ? 'success' : rule.accuracy >= 75 ? 'primary' : 'warning'}
                                />
                                <Typography variant="caption" fontWeight="bold">
                                  {rule.accuracy}%
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* Топ поставщики с рисками */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Поставщики с высокими рисками
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {summary?.topVendors.map((vendor, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemText
                          primary={vendor.vendorName}
                          secondary={
                            <>
                              <Typography variant="caption" display="block">
                                Инцидентов: {vendor.incidents}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                <Typography variant="caption">Риск:</Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={vendor.riskScore}
                                  sx={{ flexGrow: 1, height: 4, borderRadius: 1 }}
                                  color={vendor.riskScore >= 75 ? 'error' : vendor.riskScore >= 50 ? 'warning' : 'success'}
                                />
                                <Typography variant="caption" fontWeight="bold">
                                  {vendor.riskScore}
                                </Typography>
                              </Box>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>

              {/* График трендов инцидентов (упрощенная таблица) */}
              <Grid size={{ xs: 12 }}>
                <Typography variant="h6" gutterBottom>
                  Тренд инцидентов
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Дата</TableCell>
                        <TableCell align="right">Всего</TableCell>
                        <TableCell align="right">Критичные</TableCell>
                        <TableCell align="right">Высокие</TableCell>
                        <TableCell align="right">Решенные</TableCell>
                        <TableCell align="right">Ложные</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {incidentTrends.slice(-7).map((trend) => (
                        <TableRow key={trend.date}>
                          <TableCell>{new Date(trend.date).toLocaleDateString('ru-RU')}</TableCell>
                          <TableCell align="right">{trend.total}</TableCell>
                          <TableCell align="right">
                            <Chip label={trend.critical} size="small" color="error" />
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={trend.high} size="small" color="warning" />
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={trend.resolved} size="small" color="success" />
                          </TableCell>
                          <TableCell align="right">{trend.falsePositives}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Вкладка "По категориям" */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Анализ по категориям
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Категория</TableCell>
                    <TableCell align="right">Инциденты</TableCell>
                    <TableCell align="right">Доля</TableCell>
                    <TableCell align="right">Ср. время</TableCell>
                    <TableCell align="right">Тренд</TableCell>
                    <TableCell>Распределение по статусам</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categoryAnalytics.map((cat) => (
                    <TableRow key={cat.category}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {cat.categoryLabel}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{cat.totalIncidents}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${cat.percentage}%`} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{cat.avgResolutionTime}ч</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {getTrendIcon(cat.trend)}
                          <Typography
                            variant="caption"
                            sx={{ color: getTrendColor(cat.trend, true) }}
                          >
                            {Math.abs(cat.trend)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title={`Новые: ${cat.byStatus.new}`}>
                            <Chip label={cat.byStatus.new} size="small" color="error" />
                          </Tooltip>
                          <Tooltip title={`Назначено: ${cat.byStatus.assigned}`}>
                            <Chip label={cat.byStatus.assigned} size="small" color="warning" />
                          </Tooltip>
                          <Tooltip title={`На проверке: ${cat.byStatus.inReview}`}>
                            <Chip label={cat.byStatus.inReview} size="small" color="info" />
                          </Tooltip>
                          <Tooltip title={`Решено: ${cat.byStatus.resolved}`}>
                            <Chip label={cat.byStatus.resolved} size="small" color="success" />
                          </Tooltip>
                          <Tooltip title={`Ложные: ${cat.byStatus.falsePositive}`}>
                            <Chip label={cat.byStatus.falsePositive} size="small" />
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Вкладка "Команда" */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Производительность менеджеров
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Менеджер</TableCell>
                    <TableCell align="right">Назначено</TableCell>
                    <TableCell align="right">Решено</TableCell>
                    <TableCell align="right">Ср. время</TableCell>
                    <TableCell align="right">Завершение</TableCell>
                    <TableCell align="right">В срок</TableCell>
                    <TableCell align="right">Ложные %</TableCell>
                    <TableCell align="right">Эскалация %</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {managerPerformance.map((manager) => (
                    <TableRow key={manager.managerId}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {manager.managerName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{manager.managerName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{manager.totalAssigned}</TableCell>
                      <TableCell align="right">
                        <Chip label={manager.totalResolved} size="small" color="success" />
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">{manager.avgResolutionTime}ч</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                            {getTrendIcon(manager.resolutionTimeTrend)}
                            <Typography
                              variant="caption"
                              sx={{ color: getTrendColor(manager.resolutionTimeTrend, true) }}
                            >
                              {Math.abs(manager.resolutionTimeTrend)}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2">{manager.completionRate}%</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={manager.completionRate}
                            sx={{ mt: 0.5, height: 4, borderRadius: 1 }}
                            color={manager.completionRate >= 90 ? 'success' : manager.completionRate >= 75 ? 'primary' : 'warning'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">{manager.onTimeCompletion}%</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={`${manager.falsePositiveRate}%`}
                          size="small"
                          color={manager.falsePositiveRate < 5 ? 'success' : manager.falsePositiveRate < 10 ? 'warning' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">{manager.escalationRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Вкладка "Правила" */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Эффективность правил
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Правило</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell align="right">Срабатываний</TableCell>
                    <TableCell align="right">Точность</TableCell>
                    <TableCell align="right">Precision</TableCell>
                    <TableCell align="right">Recall</TableCell>
                    <TableCell align="right">В случаи</TableCell>
                    <TableCell align="right">Ср. влияние</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rulePerformance.map((rule) => (
                    <TableRow key={rule.ruleId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {rule.ruleName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          {getTrendIcon(rule.accuracyTrend)}
                          <Typography
                            variant="caption"
                            sx={{ color: getTrendColor(rule.accuracyTrend) }}
                          >
                            {Math.abs(rule.accuracyTrend)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={rule.category} size="small" />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{rule.totalTriggers}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          TP: {rule.truePositives} / FP: {rule.falsePositives}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {rule.accuracy}%
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={rule.accuracy}
                            sx={{ mt: 0.5, height: 4, borderRadius: 1 }}
                            color={rule.accuracy >= 90 ? 'success' : rule.accuracy >= 75 ? 'primary' : 'warning'}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">{rule.precision}%</TableCell>
                      <TableCell align="right">{rule.recall}%</TableCell>
                      <TableCell align="right">
                        <Chip label={rule.escalatedToCases} size="small" color="secondary" />
                      </TableCell>
                      <TableCell align="right">
                        {rule.avgImpact > 0 ? `${(rule.avgImpact / 1000).toFixed(1)}К ₽` : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Вкладка "Финансы" */}
          <TabPanel value={tabValue} index={4}>
            {financialAnalytics && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Финансовое влияние системы
                  </Typography>
                </Grid>

                {/* Ключевые финансовые метрики */}
                <Grid size={{ xs: 12, md: 3 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Выявлено нарушений
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        {(financialAnalytics.totalViolationsAmount / 1000000).toFixed(2)} млн ₽
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Количество: {financialAnalytics.totalViolationsCount}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Предотвращено убытков
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {(financialAnalytics.preventedLosses / 1000000).toFixed(2)} млн ₽
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Возвращено: {(financialAnalytics.recoveredAmount / 1000000).toFixed(2)} млн ₽
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Затраты на систему
                      </Typography>
                      <Typography variant="h5">
                        {(financialAnalytics.systemCosts / 1000000).toFixed(2)} млн ₽
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        За период
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 3 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        ROI системы
                      </Typography>
                      <Typography variant="h5" color="primary.main">
                        {financialAnalytics.roi}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Экономия: {(financialAnalytics.savings / 1000000).toFixed(2)} млн ₽
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* По категориям */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Распределение по категориям
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Категория</TableCell>
                          <TableCell align="right">Сумма</TableCell>
                          <TableCell align="right">Количество</TableCell>
                          <TableCell align="right">Доля</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financialAnalytics.byCategory.map((cat) => (
                          <TableRow key={cat.category}>
                            <TableCell>{cat.category}</TableCell>
                            <TableCell align="right">
                              {(cat.amount / 1000000).toFixed(2)} млн ₽
                            </TableCell>
                            <TableCell align="right">{cat.count}</TableCell>
                            <TableCell align="right">
                              <Chip label={`${cat.percentage}%`} size="small" />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* По месяцам */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Динамика по месяцам
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Месяц</TableCell>
                          <TableCell align="right">Нарушения</TableCell>
                          <TableCell align="right">Предотвращено</TableCell>
                          <TableCell align="right">Возвращено</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {financialAnalytics.byMonth.map((month) => (
                          <TableRow key={month.month}>
                            <TableCell>{month.month}</TableCell>
                            <TableCell align="right">
                              {(month.violations / 1000).toFixed(0)}K ₽
                            </TableCell>
                            <TableCell align="right">
                              {(month.prevented / 1000).toFixed(0)}K ₽
                            </TableCell>
                            <TableCell align="right">
                              {(month.recovered / 1000).toFixed(0)}K ₽
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          {/* Вкладка "Комплаенс" */}
          <TabPanel value={tabValue} index={5}>
            {complianceAnalytics && (
              <Grid container spacing={3}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Анализ соблюдения требований
                  </Typography>
                </Grid>

                {/* Общая статистика */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Всего проверок
                      </Typography>
                      <Typography variant="h5">{complianceAnalytics.totalChecks}</Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Выявлено нарушений
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        {complianceAnalytics.violationsDetected}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="caption" color="text.secondary">
                        Уровень соблюдения
                      </Typography>
                      <Typography variant="h5" color="success.main">
                        {complianceAnalytics.complianceRate}%
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={complianceAnalytics.complianceRate}
                        sx={{ mt: 1, height: 6, borderRadius: 1 }}
                        color="success"
                      />
                    </CardContent>
                  </Card>
                </Grid>

                {/* По типам */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    По типам требований
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Тип</TableCell>
                          <TableCell align="right">Проверок</TableCell>
                          <TableCell align="right">Нарушений</TableCell>
                          <TableCell align="right">Соблюдение</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {complianceAnalytics.byType.map((type) => (
                          <TableRow key={type.type}>
                            <TableCell>{type.typeLabel}</TableCell>
                            <TableCell align="right">{type.checks}</TableCell>
                            <TableCell align="right">
                              <Chip label={type.violations} size="small" color="error" />
                            </TableCell>
                            <TableCell align="right">
                              <Box>
                                <Typography variant="body2">{type.rate}%</Typography>
                                <LinearProgress
                                  variant="determinate"
                                  value={type.rate}
                                  sx={{ mt: 0.5, height: 4, borderRadius: 1 }}
                                  color={type.rate >= 95 ? 'success' : type.rate >= 85 ? 'primary' : 'warning'}
                                />
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Критичные области */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Критичные области
                  </Typography>
                  <List>
                    {complianceAnalytics.criticalAreas.map((area, idx) => (
                      <Box key={idx}>
                        <ListItem sx={{ px: 0 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2">{area.area}</Typography>
                                <Chip
                                  label={area.severity}
                                  size="small"
                                  color={getRiskColor(area.severity)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="caption">
                                  Нарушений: {area.violations}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <Typography variant="caption">Тренд:</Typography>
                                  {getTrendIcon(area.trend)}
                                  <Typography
                                    variant="caption"
                                    sx={{ color: getTrendColor(area.trend, true) }}
                                  >
                                    {Math.abs(area.trend)}%
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {idx < complianceAnalytics.criticalAreas.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Grid>
              </Grid>
            )}
          </TabPanel>

          {/* Вкладка "Риски поставщиков" */}
          <TabPanel value={tabValue} index={6}>
            <Typography variant="h6" gutterBottom>
              Риск-профили поставщиков
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Поставщик</TableCell>
                    <TableCell align="right">Риск-балл</TableCell>
                    <TableCell>Уровень риска</TableCell>
                    <TableCell align="right">Инциденты</TableCell>
                    <TableCell align="right">Сумма операций</TableCell>
                    <TableCell align="right">Нарушения</TableCell>
                    <TableCell>Лицензия</TableCell>
                    <TableCell align="right">Тренд</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vendorRiskAnalytics.map((vendor) => (
                    <TableRow key={vendor.vendorId}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {vendor.vendorName}
                        </Typography>
                        {!vendor.documentationComplete && (
                          <Typography variant="caption" color="warning.main">
                            ⚠ Неполная документация
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {vendor.riskScore}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={vendor.riskScore}
                            sx={{ mt: 0.5, height: 4, borderRadius: 1 }}
                            color={
                              vendor.riskScore >= 75 ? 'error' :
                              vendor.riskScore >= 50 ? 'warning' : 'success'
                            }
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.riskLevel}
                          size="small"
                          color={getRiskColor(vendor.riskLevel)}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{vendor.totalIncidents}</Typography>
                        {vendor.criticalIncidents > 0 && (
                          <Chip
                            label={`${vendor.criticalIncidents} критичных`}
                            size="small"
                            color="error"
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {(vendor.totalTransactionAmount / 1000000).toFixed(2)} млн ₽
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="error.main">
                          {(vendor.violationsAmount / 1000).toFixed(0)}K ₽
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={vendor.licenseStatus}
                          size="small"
                          color={
                            vendor.licenseStatus === 'VALID' ? 'success' :
                            vendor.licenseStatus === 'EXPIRING' ? 'warning' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                          {getTrendIcon(vendor.riskTrend)}
                          <Typography
                            variant="caption"
                            sx={{ color: getTrendColor(vendor.riskTrend, true) }}
                          >
                            {Math.abs(vendor.riskTrend)}%
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
});
