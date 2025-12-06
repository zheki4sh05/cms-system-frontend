// src/pages/supervisor/StrategicDashboardPage/StrategicDashboardPage.tsx

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
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
  People as PeopleIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Flag as FlagIcon,
  Lightbulb as InsightIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { StrategicApi } from '@shared/lib/api/strategicApi';
import type {
  StrategicDashboard,
  AnalyticsPeriod,
  StrategicKPI,
  StrategicInsight,
  ExportReportOptions,
} from '@shared/types/strategicTypes';

export const ExecutiveDashboardPage: FC = observer(() => {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<StrategicDashboard | null>(null);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Период
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current_year');
  const [customPeriod, setCustomPeriod] = useState<AnalyticsPeriod>({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    label: 'Текущий год',
  });

  useEffect(() => {
    loadDashboard();
  }, [customPeriod]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardData, insightsData] = await Promise.all([
        StrategicApi.getDashboard(customPeriod),
        StrategicApi.getInsights(customPeriod),
      ]);
      setDashboard(dashboardData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load strategic dashboard:', error);
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
      case 'current_quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        label = 'Текущий квартал';
        break;
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        label = 'Текущий год';
        break;
      case 'last_year':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        label = 'Прошлый год';
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        label = 'С начала года';
        break;
      default:
        startDate = new Date(now.getFullYear(), 0, 1);
        label = 'Текущий год';
    }
    
    setCustomPeriod({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      label,
    });
  };

  const handleExportReport = async (format: 'PDF' | 'EXCEL' | 'POWERPOINT') => {
    try {
      setExportLoading(true);
      
      const options: ExportReportOptions = {
        period: customPeriod,
        sections: ['kpis', 'financial', 'risks', 'operational', 'insights'],
        format,
        includeCharts: true,
        includeDetails: true,
      };
      
      const blob = await StrategicApi.exportReport(options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'PDF' ? 'pdf' : format === 'EXCEL' ? 'xlsx' : 'pptx';
      a.download = `strategic_report_${customPeriod.startDate}_${customPeriod.endDate}.${extension}`;
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

  const getTrendIcon = (trend: 'UP' | 'DOWN' | 'STABLE') => {
    switch (trend) {
      case 'UP': return <TrendingUpIcon fontSize="small" />;
      case 'DOWN': return <TrendingDownIcon fontSize="small" />;
      case 'STABLE': return <TrendingFlatIcon fontSize="small" />;
    }
  };

  const getTrendColor = (trend: 'UP' | 'DOWN' | 'STABLE', isGoodUp: boolean = true) => {
    if (trend === 'STABLE') return 'text.secondary';
    if (trend === 'UP') return isGoodUp ? 'success.main' : 'error.main';
    return isGoodUp ? 'error.main' : 'success.main';
  };

  const getKPIStatusColor = (status: string) => {
    switch (status) {
      case 'EXCELLENT': return 'success';
      case 'GOOD': return 'primary';
      case 'WARNING': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'CRITICAL': return 'error';
      default: return 'default';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'OPPORTUNITY': return <TrendingUpIcon color="success" />;
      case 'THREAT': return <WarningIcon color="error" />;
      case 'RECOMMENDATION': return <InsightIcon color="primary" />;
      case 'ALERT': return <ErrorIcon color="warning" />;
      default: return <InfoIcon />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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

  if (!dashboard) {
    return null;
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Заголовок */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Стратегическая панель
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {customPeriod.label} • Обновлено: {new Date(dashboard.lastUpdated).toLocaleString('ru-RU')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Период</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                label="Период"
              >
                <MenuItem value="current_quarter">Текущий квартал</MenuItem>
                <MenuItem value="current_year">Текущий год</MenuItem>
                <MenuItem value="last_year">Прошлый год</MenuItem>
                <MenuItem value="ytd">С начала года</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Обновить данные">
              <IconButton onClick={loadDashboard} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('PDF')}
              disabled={exportLoading}
            >
              PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('EXCEL')}
              disabled={exportLoading}
            >
              Excel
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportReport('POWERPOINT')}
              disabled={exportLoading}
            >
              PowerPoint
            </Button>
          </Box>
        </Box>

        {/* Ключевые KPI (верхняя строка - 4 главных) */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {dashboard.kpis.slice(0, 4).map((kpi) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={kpi.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" color="text.secondary" gutterBottom>
                        {kpi.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                        <Typography variant="h4" fontWeight="bold">
                          {kpi.unit === '₽' ? formatCurrency(kpi.currentValue) : kpi.currentValue}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {kpi.unit}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={kpi.status}
                      size="small"
                      color={getKPIStatusColor(kpi.status)}
                    />
                  </Box>
                  
                  <Box sx={{ mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">
                        Достижение цели
                      </Typography>
                      <Typography variant="caption" fontWeight="bold">
                        {kpi.achievement}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={kpi.achievement}
                      sx={{ height: 6, borderRadius: 1 }}
                      color={
                        kpi.achievement >= 100 ? 'success' :
                        kpi.achievement >= 80 ? 'primary' :
                        kpi.achievement >= 60 ? 'warning' : 'error'
                      }
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {getTrendIcon(kpi.trend)}
                    <Typography
                      variant="caption"
                      sx={{ color: getTrendColor(kpi.trend, kpi.changePercent > 0) }}
                    >
                      {kpi.changePercent > 0 ? '+' : ''}{kpi.changePercent}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      vs период
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Стратегические инсайты */}
        {insights.length > 0 && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'info.lighter' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InsightIcon />
              Стратегические инсайты
            </Typography>
            <Grid container spacing={2}>
              {insights.slice(0, 3).map((insight) => (
                <Grid size={{ xs: 12, md: 4 }} key={insight.id}>
                  <Alert
                    severity={
                      insight.type === 'OPPORTUNITY' ? 'success' :
                      insight.type === 'THREAT' ? 'error' :
                      insight.type === 'ALERT' ? 'warning' : 'info'
                    }
                    icon={getInsightIcon(insight.type)}
                  >
                    <AlertTitle>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {insight.title}
                        <Chip label={insight.priority} size="small" />
                      </Box>
                    </AlertTitle>
                    <Typography variant="body2" paragraph>
                      {insight.description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Влияние: {insight.impact}
                    </Typography>
                  </Alert>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}

        {/* Финансовые метрики */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MoneyIcon />
                Финансовая эффективность
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" color="error.main" fontWeight="bold">
                        {formatCurrency(dashboard.financial.violationsAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Выявлено нарушений
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {dashboard.financial.violationsTrend > 0 ? <ArrowUpIcon fontSize="small" color="error" /> : <ArrowDownIcon fontSize="small" color="success" />}
                        <Typography variant="caption">
                          {Math.abs(dashboard.financial.violationsTrend)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        {formatCurrency(dashboard.financial.preventedLosses)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Предотвращено убытков
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {dashboard.financial.preventedLossesTrend > 0 ? <ArrowUpIcon fontSize="small" color="success" /> : <ArrowDownIcon fontSize="small" color="error" />}
                        <Typography variant="caption">
                          {Math.abs(dashboard.financial.preventedLossesTrend)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" color="primary.main" fontWeight="bold">
                        {formatCurrency(dashboard.financial.recoveredAmount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Возвращено средств
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {dashboard.financial.recoveredAmountTrend > 0 ? <ArrowUpIcon fontSize="small" color="success" /> : <ArrowDownIcon fontSize="small" color="error" />}
                        <Typography variant="caption">
                          {Math.abs(dashboard.financial.recoveredAmountTrend)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid size={{ xs: 6, sm: 3 }}>
                  <Card variant="outlined">
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <Typography variant="h5" color="info.main" fontWeight="bold">
                        {dashboard.financial.systemROI}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ROI системы
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        {dashboard.financial.systemROITrend > 0 ? <ArrowUpIcon fontSize="small" color="success" /> : <ArrowDownIcon fontSize="small" color="error" />}
                        <Typography variant="caption">
                          {Math.abs(dashboard.financial.systemROITrend)}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Распределение по категориям
              </Typography>
              <List dense>
                {dashboard.financial.byCategory.slice(0, 5).map((cat, idx) => (
                  <ListItem key={idx} sx={{ px: 0 }}>
                    <ListItemText
                      primary={cat.category}
                      secondary={
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={cat.percentage}
                            sx={{ mt: 0.5, mb: 0.5, height: 4, borderRadius: 1 }}
                          />
                          <Typography variant="caption">
                            {formatCurrency(cat.amount)} ₽ ({cat.percentage}%)
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Прогноз и ROI */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Прогноз на следующий квартал
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Ожидаемые предотвращенные убытки
                </Typography>
                <Typography variant="h5" color="success.main" fontWeight="bold">
                  {formatCurrency(dashboard.financial.forecast.nextQuarterPrevented)} ₽
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Прогнозируемый ROI
                </Typography>
                <Typography variant="h5" color="primary.main" fontWeight="bold">
                  {dashboard.financial.forecast.nextQuarterROI}%
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Достоверность прогноза
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={dashboard.financial.forecast.confidence}
                    sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                    color="info"
                  />
                  <Typography variant="caption" fontWeight="bold">
                    {dashboard.financial.forecast.confidence}%
                  </Typography>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Экономия vs Затраты
              </Typography>
              <Box sx={{ textAlign: 'center', my: 2 }}>
                <Typography variant="h3" color="success.main" fontWeight="bold">
                  {((dashboard.financial.totalSavings / dashboard.financial.systemCosts) * 100).toFixed(0)}x
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  возврат инвестиций
                </Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Затраты на систему:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {formatCurrency(dashboard.financial.systemCosts)} ₽
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">Общая экономия:</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {formatCurrency(dashboard.financial.totalSavings)} ₽
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Риски и Производительность */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Риски */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon />
                Управление рисками
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Общий уровень риска
                  </Typography>
                  <Chip
                    label={dashboard.riskMetrics.riskStatus}
                    size="small"
                    color={getRiskLevelColor(dashboard.riskMetrics.riskStatus)}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                      variant="determinate"
                      value={dashboard.riskMetrics.overallRiskLevel}
                      size={80}
                      thickness={5}
                      color={
                        dashboard.riskMetrics.riskStatus === 'LOW' ? 'success' :
                        dashboard.riskMetrics.riskStatus === 'MEDIUM' ? 'info' :
                        dashboard.riskMetrics.riskStatus === 'HIGH' ? 'warning' : 'error'
                      }
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold">
                        {dashboard.riskMetrics.overallRiskLevel}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="error.main">
                          Критичные: {dashboard.riskMetrics.criticalRisks}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="warning.main">
                          Высокие: {dashboard.riskMetrics.highRisks}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="info.main">
                          Средние: {dashboard.riskMetrics.mediumRisks}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="success.main">
                          Низкие: {dashboard.riskMetrics.lowRisks}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Топ рисковые поставщики
              </Typography>
              <List dense>
                {dashboard.riskMetrics.topRiskyVendors.slice(0, 5).map((vendor) => (
                  <ListItem key={vendor.vendorId} sx={{ px: 0 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2">{vendor.vendorName}</Typography>
                          <Chip
                            label={vendor.riskLevel}
                            size="small"
                            color={getRiskLevelColor(vendor.riskLevel)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <LinearProgress
                            variant="determinate"
                            value={vendor.riskScore}
                            sx={{ mt: 0.5, mb: 0.5, height: 4, borderRadius: 1 }}
                            color={
                              vendor.riskLevel === 'LOW' ? 'success' :
                              vendor.riskLevel === 'MEDIUM' ? 'info' :
                              vendor.riskLevel === 'HIGH' ? 'warning' : 'error'
                            }
                          />
                          <Typography variant="caption">
                            Инцидентов: {vendor.incidents} • Сумма: {formatCurrency(vendor.totalAmount)} ₽
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Уровень комплаенса
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    {dashboard.riskMetrics.complianceScore}%
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">
                    Нарушений
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {dashboard.riskMetrics.complianceViolations}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Производительность системы */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon />
                Производительность системы
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      {dashboard.systemPerformance.overallEfficiency}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Общая эффективность
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      {dashboard.systemPerformance.efficiencyTrend > 0 ? <ArrowUpIcon fontSize="small" color="success" /> : <ArrowDownIcon fontSize="small" color="error" />}
                      <Typography variant="caption">
                        {Math.abs(dashboard.systemPerformance.efficiencyTrend)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {dashboard.systemPerformance.detectionAccuracy}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Точность обнаружения
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      {dashboard.systemPerformance.accuracyTrend > 0 ? <ArrowUpIcon fontSize="small" color="success" /> : <ArrowDownIcon fontSize="small" color="error" />}
                      <Typography variant="caption">
                        {Math.abs(dashboard.systemPerformance.accuracyTrend)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Активные правила
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(dashboard.systemPerformance.activeRules / dashboard.systemPerformance.totalRules) * 100}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {dashboard.systemPerformance.activeRules}/{dashboard.systemPerformance.totalRules}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Активные пользователи
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(dashboard.systemPerformance.activeUsers / dashboard.systemPerformance.totalUsers) * 100}
                      sx={{ flexGrow: 1, height: 6, borderRadius: 1 }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {dashboard.systemPerformance.activeUsers}/{dashboard.systemPerformance.totalUsers}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Топ эффективные правила
              </Typography>
              <List dense>
                {dashboard.systemPerformance.topPerformingRules.slice(0, 3).map((rule) => (
                  <ListItem key={rule.ruleId} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.main' }}>
                        <CheckIcon fontSize="small" />
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={rule.ruleName}
                      secondary={`Точность: ${rule.accuracy}% • Срабатываний: ${rule.triggers}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Обработано инцидентов
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {dashboard.systemPerformance.incidentsProcessed}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Ср. время решения
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {dashboard.systemPerformance.avgResolutionTime}ч
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Процент решения
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {dashboard.systemPerformance.resolutionRate}%
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        {/* Операционная эффективность и команда */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                Операционная эффективность
              </Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                      {dashboard.operational.teamEfficiency}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Эффективность команды
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold">
                      {dashboard.operational.automationRate}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Автоматизация
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      {dashboard.operational.slaCompliance}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Соблюдение SLA
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Случаи
              </Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Активные
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="warning.main">
                    {dashboard.operational.activeCases}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    Закрытые
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {dashboard.operational.closedCases}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 4 }}>
                  <Typography variant="caption" color="text.secondary">
                    % закрытия
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {dashboard.operational.caseClosureRate}%
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleIcon />
                Производительность команды
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Менеджер</TableCell>
                      <TableCell align="right">Эффект.</TableCell>
                      <TableCell align="right">Загрузка</TableCell>
                      <TableCell align="right">% завершения</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.operational.managerPerformance.map((manager) => (
                      <TableRow key={manager.managerId} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              {manager.managerName.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{manager.managerName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${manager.efficiency}%`}
                            size="small"
                            color={manager.efficiency >= 90 ? 'success' : manager.efficiency >= 75 ? 'primary' : 'warning'}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{manager.workload}%</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">
                            {manager.completionRate}%
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
});
