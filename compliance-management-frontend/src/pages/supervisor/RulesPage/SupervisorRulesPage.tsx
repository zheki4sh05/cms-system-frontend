// src/pages/supervisor/RulesPage/RulesPage.tsx
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
  Divider,
  CircularProgress,
  Tooltip,
  Switch,
  FormControlLabel,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  AlertTitle,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ContentCopy as CloneIcon,
  PlayArrow as TestIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  History as HistoryIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  CloudUpload as CloudUploadIcon,
  Check as ValidIcon,
} from '@mui/icons-material';
import { RuleApi } from '@shared/lib/api/ruleApi';
import type {
  Rule,
  RuleCategory,
  RuleSeverity,
  RuleStatus,
  RuleStatistics,
  RuleTriggerHistory,
  CreateRuleRequest,
  UpdateRuleRequest,
  RuleCondition,
  RuleAction,
  ConditionOperator,
  ActionType,
  ValidateScriptResponse,
} from '@shared/types/rulesTypes';

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

export const SupervisorRulesPage: FC = observer(() => {
   const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<Rule[]>([]);
  const [statistics, setStatistics] = useState<RuleStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Фильтры
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  
  // Диалоги
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  
  // Выбранное правило
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [triggerHistory, setTriggerHistory] = useState<RuleTriggerHistory[]>([]);
  
  // Форма создания/редактирования
  const [formData, setFormData] = useState<Partial<CreateRuleRequest>>({
    name: '',
    description: '',
    category: 'FINANCIAL',
    severity: 'MEDIUM',
    conditions: [],
    actions: [],
    priority: 1,
    groovyScript: '',
    scriptFileName: '',
  });
  
  // Groovy скрипт
  const [groovyScript, setGroovyScript] = useState<string>('');
  const [scriptFile, setScriptFile] = useState<File | null>(null);
  const [scriptValidation, setScriptValidation] = useState<ValidateScriptResponse | null>(null);
  const [validatingScript, setValidatingScript] = useState(false);
  
  // Тестирование
  const [testData, setTestData] = useState<string>('{}');
  const [testResult, setTestResult] = useState<any>(null);
  
  // Экспорт/импорт
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const [rulesData, statsData] = await Promise.all([
        RuleApi.getAllRules(),
        RuleApi.getRuleStatistics(),
      ]);
      setRules(rulesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenView = async (rule: Rule) => {
    setSelectedRule(rule);
    setViewDialogOpen(true);
    
    try {
      const history = await RuleApi.getRuleTriggerHistory(rule.id);
      setTriggerHistory(history);
    } catch (error) {
      console.error('Failed to load trigger history:', error);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      description: '',
      category: 'FINANCIAL',
      severity: 'MEDIUM',
      conditions: [],
      actions: [],
      priority: 1,
      groovyScript: '',
      scriptFileName: '',
    });
    setGroovyScript('');
    setScriptFile(null);
    setScriptValidation(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (rule: Rule) => {
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      category: rule.category,
      severity: rule.severity,
      conditions: rule.conditions.map(c => ({ ...c, id: undefined })) as any,
      actions: rule.actions.map(a => ({ ...a, id: undefined })) as any,
      priority: rule.priority,
      threshold: rule.threshold,
      groovyScript: rule.groovyScript,
      scriptFileName: rule.scriptFileName,
    });
    setGroovyScript(rule.groovyScript || '');
    setScriptFile(null);
    setScriptValidation(null);
    setEditDialogOpen(true);
  };

  const handleOpenDelete = (rule: Rule) => {
    setSelectedRule(rule);
    setDeleteDialogOpen(true);
  };

  const handleOpenHistory = async (rule: Rule) => {
    setSelectedRule(rule);
    setHistoryDialogOpen(true);
    
    try {
      const history = await RuleApi.getRuleTriggerHistory(rule.id);
      setTriggerHistory(history);
    } catch (error) {
      console.error('Failed to load trigger history:', error);
    }
  };

  const handleOpenTest = (rule: Rule) => {
    setSelectedRule(rule);
    setTestData(JSON.stringify({
      vendorId: 'VENDOR-001',
      amount: 500000,
      budgetLimit: 450000,
    }, null, 2));
    setTestResult(null);
    setTestDialogOpen(true);
  };

  const handleScriptFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Проверка расширения файла
    if (!file.name.endsWith('.groovy')) {
      alert('Пожалуйста, загрузите файл с расширением .groovy');
      return;
    }
    
    try {
      const text = await file.text();
      setScriptFile(file);
      setGroovyScript(text);
      setFormData({
        ...formData,
        groovyScript: text,
        scriptFileName: file.name,
      });
      
      // Автоматическая валидация
      handleValidateScript(text);
    } catch (error) {
      console.error('Failed to read script file:', error);
      alert('Ошибка при чтении файла');
    }
  };

  const handleValidateScript = async (script?: string) => {
    const scriptToValidate = script || groovyScript;
    
    if (!scriptToValidate.trim()) {
      setScriptValidation(null);
      return;
    }
    
    try {
      setValidatingScript(true);
      const result = await RuleApi.validateScript({ script: scriptToValidate });
      setScriptValidation(result);
    } catch (error) {
      console.error('Failed to validate script:', error);
    } finally {
      setValidatingScript(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      await RuleApi.createRule(formData as CreateRuleRequest);
      await loadRules();
      setCreateDialogOpen(false);
      setGroovyScript('');
      setScriptFile(null);
      setScriptValidation(null);
    } catch (error) {
      console.error('Failed to create rule:', error);
    }
  };

  const handleUpdateRule = async () => {
    if (!selectedRule) return;
    
    try {
      await RuleApi.updateRule(selectedRule.id, formData as UpdateRuleRequest);
      await loadRules();
      setEditDialogOpen(false);
      setGroovyScript('');
      setScriptFile(null);
      setScriptValidation(null);
    } catch (error) {
      console.error('Failed to update rule:', error);
    }
  };

  const handleDeleteRule = async () => {
    if (!selectedRule) return;
    
    try {
      await RuleApi.deleteRule(selectedRule.id);
      await loadRules();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleToggleRule = async (rule: Rule) => {
    try {
      if (rule.isActive) {
        await RuleApi.deactivateRule(rule.id);
      } else {
        await RuleApi.activateRule(rule.id);
      }
      await loadRules();
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleCloneRule = async (rule: Rule) => {
    try {
      await RuleApi.cloneRule(rule.id);
      await loadRules();
    } catch (error) {
      console.error('Failed to clone rule:', error);
    }
  };

  const handleTestRule = async () => {
    if (!selectedRule) return;
    
    try {
      const testDataObj = JSON.parse(testData);
      const result = await RuleApi.testRule({
        conditions: selectedRule.conditions.map(c => ({ ...c, id: undefined })) as any,
        testData: testDataObj,
      });
      setTestResult(result);
    } catch (error) {
      console.error('Failed to test rule:', error);
    }
  };

  const handleExportRules = async (format: 'json' | 'csv') => {
    try {
      setExportLoading(true);
      const blob = await RuleApi.exportRules(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rules_export_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to export rules:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleImportRules = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      const result = await RuleApi.importRules(file);
      alert(`Импортировано: ${result.imported}, Ошибок: ${result.failed}`);
      await loadRules();
    } catch (error) {
      console.error('Failed to import rules:', error);
    }
  };

  const getCategoryLabel = (category: RuleCategory) => {
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

  const getSeverityColor = (severity: RuleSeverity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
    }
  };

  const getStatusColor = (status: RuleStatus) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'DISABLED': return 'default';
      case 'DRAFT': return 'info';
      case 'UNDER_REVIEW': return 'warning';
      case 'ARCHIVED': return 'default';
    }
  };

  const getStatusLabel = (status: RuleStatus) => {
    const labels = {
      ACTIVE: 'Активно',
      DISABLED: 'Отключено',
      DRAFT: 'Черновик',
      UNDER_REVIEW: 'На проверке',
      ARCHIVED: 'Архивировано',
    };
    return labels[status];
  };

  const getOperatorLabel = (operator: ConditionOperator) => {
    const labels = {
      EQUALS: 'Равно',
      NOT_EQUALS: 'Не равно',
      GREATER_THAN: 'Больше',
      LESS_THAN: 'Меньше',
      GREATER_THAN_OR_EQUAL: 'Больше или равно',
      LESS_THAN_OR_EQUAL: 'Меньше или равно',
      CONTAINS: 'Содержит',
      NOT_CONTAINS: 'Не содержит',
      STARTS_WITH: 'Начинается с',
      ENDS_WITH: 'Заканчивается на',
      IN: 'В списке',
      NOT_IN: 'Не в списке',
      IS_NULL: 'Пусто',
      IS_NOT_NULL: 'Не пусто',
    };
    return labels[operator];
  };

  const getActionTypeLabel = (type: ActionType) => {
    const labels = {
      CREATE_INCIDENT: 'Создать инцидент',
      SEND_NOTIFICATION: 'Отправить уведомление',
      ESCALATE: 'Эскалировать',
      BLOCK_TRANSACTION: 'Заблокировать транзакцию',
      LOG_EVENT: 'Записать в лог',
      TRIGGER_WORKFLOW: 'Запустить процесс',
    };
    return labels[type];
  };

  const filteredRules = rules.filter(r => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!(r.name.toLowerCase().includes(query) ||
            r.description.toLowerCase().includes(query) ||
            r.id.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    if (filterCategory !== 'all' && r.category !== filterCategory) {
      return false;
    }
    
    if (filterStatus !== 'all' && r.status !== filterStatus) {
      return false;
    }
    
    if (filterSeverity !== 'all' && r.severity !== filterSeverity) {
      return false;
    }
    
    return true;
  });

  const activeRules = filteredRules.filter(r => r.status === 'ACTIVE');
  const disabledRules = filteredRules.filter(r => r.status === 'DISABLED');
  const draftRules = filteredRules.filter(r => r.status === 'DRAFT');

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
              Управление правилами
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Настройка и мониторинг правил контроля
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={() => handleExportRules('json')}
              disabled={exportLoading}
            >
              Экспорт
            </Button>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
            >
              Импорт
              <input
                type="file"
                hidden
                accept=".json,.csv"
                onChange={handleImportRules}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Создать правило
            </Button>
          </Box>
        </Box>

        {/* Статистика */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{statistics.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Всего правил</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">{statistics.active}</Typography>
                  <Typography variant="body2" color="text.secondary">Активных</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="text.secondary">{statistics.disabled}</Typography>
                  <Typography variant="body2" color="text.secondary">Отключено</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{statistics.totalTriggers}</Typography>
                  <Typography variant="body2" color="text.secondary">Срабатываний</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary.main">{statistics.avgAccuracy}%</Typography>
                  <Typography variant="body2" color="text.secondary">Ср. точность</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="info.main">{statistics.draft}</Typography>
                  <Typography variant="body2" color="text.secondary">Черновики</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Фильтры и поиск */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Поиск правил..."
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
                <InputLabel>Статус</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Статус"
                >
                  <MenuItem value="all">Все</MenuItem>
                  <MenuItem value="ACTIVE">Активно</MenuItem>
                  <MenuItem value="DISABLED">Отключено</MenuItem>
                  <MenuItem value="DRAFT">Черновик</MenuItem>
                </Select>
              </FormControl>
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
            <Grid size={{ xs: 12, sm: 12, md: 2 }}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setFilterCategory('all');
                  setFilterStatus('all');
                  setFilterSeverity('all');
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
            <Tab label={`Активные (${activeRules.length})`} />
            <Tab label={`Отключенные (${disabledRules.length})`} />
            <Tab label={`Черновики (${draftRules.length})`} />
            <Tab label={`Все правила (${filteredRules.length})`} />
          </Tabs>

          {/* Вкладка "Активные" */}
          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Правило</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell align="right">Срабатываний</TableCell>
                    <TableCell align="right">Точность</TableCell>
                    <TableCell>Активность</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeRules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {rule.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {rule.description.substring(0, 60)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryLabel(rule.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.severity}
                          size="small"
                          color={getSeverityColor(rule.severity)}
                        />
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
                            color={
                              rule.accuracy >= 90 ? 'success' :
                              rule.accuracy >= 75 ? 'primary' : 'warning'
                            }
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isActive}
                          onChange={() => handleToggleRule(rule)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenView(rule)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="История">
                          <IconButton size="small" onClick={() => handleOpenHistory(rule)}>
                            <HistoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Тестировать">
                          <IconButton size="small" color="info" onClick={() => handleOpenTest(rule)}>
                            <TestIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton size="small" color="primary" onClick={() => handleOpenEdit(rule)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Клонировать">
                          <IconButton size="small" onClick={() => handleCloneRule(rule)}>
                            <CloneIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Вкладка "Отключенные" */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Правило</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell align="right">Срабатываний</TableCell>
                    <TableCell align="right">Точность</TableCell>
                    <TableCell>Активность</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disabledRules.map((rule) => (
                    <TableRow key={rule.id} hover sx={{ opacity: 0.6 }}>
                      <TableCell>
                        <Typography variant="body2">{rule.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryLabel(rule.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.severity}
                          size="small"
                          color={getSeverityColor(rule.severity)}
                        />
                      </TableCell>
                      <TableCell align="right">{rule.totalTriggers}</TableCell>
                      <TableCell align="right">{rule.accuracy}%</TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isActive}
                          onChange={() => handleToggleRule(rule)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenView(rule)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton size="small" onClick={() => handleOpenEdit(rule)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error" onClick={() => handleOpenDelete(rule)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Вкладка "Черновики" */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Правило</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Создано</TableCell>
                    <TableCell>Автор</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {draftRules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Typography variant="body2">{rule.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryLabel(rule.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.severity}
                          size="small"
                          color={getSeverityColor(rule.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(rule.createdAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>{rule.createdByName}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Редактировать">
                          <IconButton size="small" onClick={() => handleOpenEdit(rule)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                          <IconButton size="small" color="error" onClick={() => handleOpenDelete(rule)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Вкладка "Все правила" */}
          <TabPanel value={tabValue} index={3}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Правило</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align="right">Срабатываний</TableCell>
                    <TableCell align="right">Точность</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRules.map((rule) => (
                    <TableRow key={rule.id} hover>
                      <TableCell>
                        <Typography variant="body2">{rule.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={getCategoryLabel(rule.category)} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={rule.severity}
                          size="small"
                          color={getSeverityColor(rule.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(rule.status)}
                          size="small"
                          color={getStatusColor(rule.status)}
                        />
                      </TableCell>
                      <TableCell align="right">{rule.totalTriggers}</TableCell>
                      <TableCell align="right">{rule.accuracy}%</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton size="small" onClick={() => handleOpenView(rule)}>
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                          <IconButton size="small" onClick={() => handleOpenEdit(rule)}>
                            <EditIcon fontSize="small" />
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

        {/* Диалог просмотра правила */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedRule && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{selectedRule.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={getCategoryLabel(selectedRule.category)}
                      size="small"
                    />
                    <Chip
                      label={selectedRule.severity}
                      size="small"
                      color={getSeverityColor(selectedRule.severity)}
                    />
                    <Chip
                      label={getStatusLabel(selectedRule.status)}
                      size="small"
                      color={getStatusColor(selectedRule.status)}
                    />
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent>
                <Typography variant="body1" paragraph>
                  {selectedRule.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">ID правила</Typography>
                    <Typography variant="body2">{selectedRule.id}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Приоритет</Typography>
                    <Typography variant="body2">{selectedRule.priority}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Создано</Typography>
                    <Typography variant="body2">
                      {new Date(selectedRule.createdAt).toLocaleString('ru-RU')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Автор</Typography>
                    <Typography variant="body2">{selectedRule.createdByName}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Последнее обновление</Typography>
                    <Typography variant="body2">
                      {new Date(selectedRule.updatedAt).toLocaleString('ru-RU')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Последнее срабатывание</Typography>
                    <Typography variant="body2">
                      {selectedRule.lastTriggeredAt
                        ? new Date(selectedRule.lastTriggeredAt).toLocaleString('ru-RU')
                        : 'Нет данных'}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Метрики эффективности */}
                <Typography variant="subtitle2" gutterBottom>
                  Метрики эффективности
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6">{selectedRule.totalTriggers}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Срабатываний
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="success.main">
                          {selectedRule.truePositives}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          True Positive
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="error.main">
                          {selectedRule.falsePositives}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          False Positive
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 3 }}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="h6" color="primary.main">
                          {selectedRule.accuracy}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Точность
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Условия правила */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      Условия ({selectedRule.conditions.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {selectedRule.conditions.map((condition, idx) => (
                        <ListItem key={condition.id}>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {idx > 0 && condition.logicalOperator && (
                                  <Chip
                                    label={condition.logicalOperator}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                <Typography variant="body2">
                                  <strong>{condition.field}</strong>{' '}
                                  {getOperatorLabel(condition.operator)}{' '}
                                  <strong>{JSON.stringify(condition.value)}</strong>
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* Действия правила */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">
                      Действия ({selectedRule.actions.length})
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <List dense>
                      {selectedRule.actions.map((action) => (
                        <ListItem key={action.id}>
                          <ListItemText
                            primary={getActionTypeLabel(action.type)}
                            secondary={
                              <pre style={{ margin: 0, fontSize: '0.75rem' }}>
                                {JSON.stringify(action.parameters, null, 2)}
                              </pre>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </AccordionDetails>
                </Accordion>

                {/* История срабатываний */}
                {triggerHistory.length > 0 && (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">
                        Последние срабатывания ({triggerHistory.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {triggerHistory.slice(0, 5).map((history) => (
                          <ListItem key={history.id}>
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  <Typography variant="body2">
                                    {new Date(history.triggeredAt).toLocaleString('ru-RU')}
                                  </Typography>
                                  <Chip
                                    label={history.result}
                                    size="small"
                                    color={
                                      history.result === 'TRUE_POSITIVE' ? 'success' :
                                      history.result === 'FALSE_POSITIVE' ? 'error' : 'default'
                                    }
                                  />
                                </Box>
                              }
                              secondary={history.notes || 'Нет заметок'}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setViewDialogOpen(false)}>
                  Закрыть
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<TestIcon />}
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleOpenTest(selectedRule);
                  }}
                >
                  Тестировать
                </Button>
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={() => {
                    setViewDialogOpen(false);
                    handleOpenEdit(selectedRule);
                  }}
                >
                  Редактировать
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог создания правила */}
        <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Создать новое правило</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Название правила"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Описание"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Категория</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as RuleCategory })}
                      label="Категория"
                    >
                      <MenuItem value="FINANCIAL">Финансы</MenuItem>
                      <MenuItem value="COMPLIANCE">Комплаенс</MenuItem>
                      <MenuItem value="LOGISTICS">Логистика</MenuItem>
                      <MenuItem value="ETHICS">Этика</MenuItem>
                      <MenuItem value="DATA_QUALITY">Качество данных</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Критичность</InputLabel>
                    <Select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
                      label="Критичность"
                    >
                      <MenuItem value="LOW">Низкая</MenuItem>
                      <MenuItem value="MEDIUM">Средняя</MenuItem>
                      <MenuItem value="HIGH">Высокая</MenuItem>
                      <MenuItem value="CRITICAL">Критичная</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Приоритет"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                sx={{ mb: 2 }}
              />

              <Alert severity="info" sx={{ mb: 2 }}>
                Настройка условий и действий будет доступна после создания правила в режиме редактирования.
              </Alert>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setCreateDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateRule}
              disabled={!formData.name || !formData.description}
            >
              Создать
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог редактирования (упрощенный) */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Редактировать правило</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Название правила"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Описание"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Категория</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as RuleCategory })}
                      label="Категория"
                    >
                      <MenuItem value="FINANCIAL">Финансы</MenuItem>
                      <MenuItem value="COMPLIANCE">Комплаенс</MenuItem>
                      <MenuItem value="LOGISTICS">Логистика</MenuItem>
                      <MenuItem value="ETHICS">Этика</MenuItem>
                      <MenuItem value="DATA_QUALITY">Качество данных</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Критичность</InputLabel>
                    <Select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
                      label="Критичность"
                    >
                      <MenuItem value="LOW">Низкая</MenuItem>
                      <MenuItem value="MEDIUM">Средняя</MenuItem>
                      <MenuItem value="HIGH">Высокая</MenuItem>
                      <MenuItem value="CRITICAL">Критичная</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Приоритет"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => setEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateRule}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог удаления */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          maxWidth="sm"
        >
          <DialogTitle>Удалить правило?</DialogTitle>
          <DialogContent>
            {selectedRule && (
              <Alert severity="warning">
                Вы уверены, что хотите удалить правило "<strong>{selectedRule.name}</strong>"?
                Это действие нельзя отменить.
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeleteRule}
            >
              Удалить
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог тестирования */}
         <Dialog
          open={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Создать новое правило</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Название правила"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              
              <TextField
                fullWidth
                label="Описание"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{xs:6}}>
                  <FormControl fullWidth>
                    <InputLabel>Категория</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as RuleCategory })}
                      label="Категория"
                    >
                      <MenuItem value="FINANCIAL">Финансы</MenuItem>
                      <MenuItem value="COMPLIANCE">Комплаенс</MenuItem>
                      <MenuItem value="LOGISTICS">Логистика</MenuItem>
                      <MenuItem value="ETHICS">Этика</MenuItem>
                      <MenuItem value="DATA_QUALITY">Качество данных</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{xs:6}}>
                  <FormControl fullWidth>
                    <InputLabel>Критичность</InputLabel>
                    <Select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
                      label="Критичность"
                    >
                      <MenuItem value="LOW">Низкая</MenuItem>
                      <MenuItem value="MEDIUM">Средняя</MenuItem>
                      <MenuItem value="HIGH">Высокая</MenuItem>
                      <MenuItem value="CRITICAL">Критичная</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Приоритет"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ mb: 3 }} />

              {/* Секция загрузки Groovy скрипта */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon />
                  Groovy скрипт для анализа данных
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Загрузите Groovy скрипт (.groovy), который будет анализировать данные закупочной процедуры 
                  и генерировать инциденты при обнаружении нарушений.
                </Typography>

                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {scriptFile ? scriptFile.name : 'Загрузить Groovy скрипт (.groovy)'}
                  <input
                    type="file"
                    hidden
                    accept=".groovy"
                    onChange={handleScriptFileUpload}
                  />
                </Button>

                {groovyScript && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Содержимое скрипта:
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={validatingScript ? <CircularProgress size={16} /> : <CheckIcon />}
                        onClick={() => handleValidateScript()}
                        disabled={validatingScript}
                      >
                        Валидировать
                      </Button>
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      value={groovyScript}
                      onChange={(e) => {
                        setGroovyScript(e.target.value);
                        setFormData({
                          ...formData,
                          groovyScript: e.target.value,
                        });
                      }}
                      sx={{
                        mb: 2,
                        '& .MuiInputBase-input': {
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        },
                      }}
                      placeholder={`// Пример Groovy скрипта для анализа закупок

def purchase = binding.getVariable("purchase")
def vendor = binding.getVariable("vendor")

// Проверка превышения бюджета
if (purchase.amount > purchase.approvedBudget * 1.1) {
    return [
        violation: true,
        message: "Превышение бюджета на \${(purchase.amount - purchase.approvedBudget)} руб.",
        severity: "HIGH"
    ]
}

return [violation: false]`}
                    />

                    {/* Результат валидации */}
                    {scriptValidation && (
                      <Box sx={{ mb: 2 }}>
                        {scriptValidation.valid ? (
                          <Alert severity="success" icon={<ValidIcon />}>
                            <AlertTitle>Скрипт валиден</AlertTitle>
                            Groovy скрипт успешно прошел валидацию и готов к использованию.
                          </Alert>
                        ) : (
                          <Alert severity="error">
                            <AlertTitle>Ошибки в скрипте</AlertTitle>
                            <List dense>
                              {scriptValidation.errors.map((error, idx) => (
                                <ListItem key={idx} sx={{ py: 0 }}>
                                  <Typography variant="caption" color="error">
                                    • {error}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}

                        {scriptValidation.warnings && scriptValidation.warnings.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <AlertTitle>Предупреждения</AlertTitle>
                            <List dense>
                              {scriptValidation.warnings.map((warning, idx) => (
                                <ListItem key={idx} sx={{ py: 0 }}>
                                  <Typography variant="caption">
                                    • {warning}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}

                        {scriptValidation.suggestions && scriptValidation.suggestions.length > 0 && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <AlertTitle>Рекомендации</AlertTitle>
                            <List dense>
                              {scriptValidation.suggestions.map((suggestion, idx) => (
                                <ListItem key={idx} sx={{ py: 0 }}>
                                  <Typography variant="caption">
                                    • {suggestion}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {!groovyScript && (
                  <Alert severity="info">
                    Groovy скрипт опционален. Вы можете добавить его позже при редактировании правила.
                  </Alert>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => {
              setCreateDialogOpen(false);
              setGroovyScript('');
              setScriptFile(null);
              setScriptValidation(null);
            }}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateRule}
              disabled={
                !formData.name || 
                !formData.description ||
                (scriptValidation !== null && !scriptValidation.valid)
              }
            >
              Создать
            </Button>
          </DialogActions>
        </Dialog>

        {/* Диалог редактирования С GROOVY - аналогично диалогу создания */}
        <Dialog
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>Редактировать правило</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Название правила"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Описание"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs:6 }} >
                  <FormControl fullWidth>
                    <InputLabel>Категория</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as RuleCategory })}
                      label="Категория"
                    >
                      <MenuItem value="FINANCIAL">Финансы</MenuItem>
                      <MenuItem value="COMPLIANCE">Комплаенс</MenuItem>
                      <MenuItem value="LOGISTICS">Логистика</MenuItem>
                      <MenuItem value="ETHICS">Этика</MenuItem>
                      <MenuItem value="DATA_QUALITY">Качество данных</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid  size={{ xs:6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Критичность</InputLabel>
                    <Select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as RuleSeverity })}
                      label="Критичность"
                    >
                      <MenuItem value="LOW">Низкая</MenuItem>
                      <MenuItem value="MEDIUM">Средняя</MenuItem>
                      <MenuItem value="HIGH">Высокая</MenuItem>
                      <MenuItem value="CRITICAL">Критичная</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label="Приоритет"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ mb: 3 }} />

              {/* Секция Groovy скрипта */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CodeIcon />
                  Groovy скрипт для анализа данных
                </Typography>

                {formData.scriptFileName && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    Текущий скрипт: <strong>{formData.scriptFileName}</strong>
                    {selectedRule?.scriptUploadedAt && (
                      <Typography variant="caption" display="block">
                        Загружен: {new Date(selectedRule.scriptUploadedAt).toLocaleString('ru-RU')}
                      </Typography>
                    )}
                  </Alert>
                )}

                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  {scriptFile ? scriptFile.name : 'Загрузить новый Groovy скрипт (.groovy)'}
                  <input
                    type="file"
                    hidden
                    accept=".groovy"
                    onChange={handleScriptFileUpload}
                  />
                </Button>

                {groovyScript && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2">
                        Содержимое скрипта:
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={validatingScript ? <CircularProgress size={16} /> : <CheckIcon />}
                        onClick={() => handleValidateScript()}
                        disabled={validatingScript}
                      >
                        Валидировать
                      </Button>
                    </Box>

                    <TextField
                      fullWidth
                      multiline
                      rows={12}
                      value={groovyScript}
                      onChange={(e) => {
                        setGroovyScript(e.target.value);
                        setFormData({
                          ...formData,
                          groovyScript: e.target.value,
                        });
                      }}
                      sx={{
                        mb: 2,
                        '& .MuiInputBase-input': {
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        },
                      }}
                    />

                    {/* Результат валидации */}
                    {scriptValidation && (
                      <Box sx={{ mb: 2 }}>
                        {scriptValidation.valid ? (
                          <Alert severity="success" icon={<ValidIcon />}>
                            <AlertTitle>Скрипт валиден</AlertTitle>
                            Groovy скрипт успешно прошел валидацию и готов к использованию.
                          </Alert>
                        ) : (
                          <Alert severity="error">
                            <AlertTitle>Ошибки в скрипте</AlertTitle>
                            <List dense>
                              {scriptValidation.errors.map((error, idx) => (
                                <ListItem key={idx} sx={{ py: 0 }}>
                                  <Typography variant="caption" color="error">
                                    • {error}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}

                        {scriptValidation.warnings && scriptValidation.warnings.length > 0 && (
                          <Alert severity="warning" sx={{ mt: 1 }}>
                            <AlertTitle>Предупреждения</AlertTitle>
                            <List dense>
                              {scriptValidation.warnings.map((warning, idx) => (
                                <ListItem key={idx} sx={{ py: 0 }}>
                                  <Typography variant="caption">
                                    • {warning}
                                  </Typography>
                                </ListItem>
                              ))}
                            </List>
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={() => {
              setEditDialogOpen(false);
              setGroovyScript('');
              setScriptFile(null);
              setScriptValidation(null);
            }}>
              Отмена
            </Button>
            <Button
              variant="contained"
              onClick={handleUpdateRule}
              disabled={scriptValidation !== null && !scriptValidation.valid}
            >
              Сохранить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
});
