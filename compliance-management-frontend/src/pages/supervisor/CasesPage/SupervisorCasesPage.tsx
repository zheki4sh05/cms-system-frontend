// src/pages/supervisor/CasesPage/CasesPage.tsx

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
  ListItemIcon,
  ListItemAvatar,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  Stack,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  ExpandMore as ExpandMoreIcon,
  AttachFile as AttachIcon,
  Comment as CommentIcon,
  History as HistoryIcon,
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Error as ErrorIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Assessment as AssessmentIcon,
  Flag as FlagIcon,
  Close as CloseIcon,
  DeleteOutline as DeleteOutlineIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CaseApi } from '@shared/lib/api/caseApi';
import { getFileKindShortLabel } from '@shared/lib/fileDisplay';
import { getCaseStatusLabelRu } from '@shared/lib/statusLabels';
import { getSeverityLabelRu, getTaskStatusLabelRu } from '@shared/lib/domainLabelsRu';
import {
  CaseSeverity,
  type Case,
  CaseStatus,
  type CaseComment,
  type CaseAttachment,
  type CaseStatistics,
  type CaseVerificationDetails,
  type VerificationDecision,
  type CaseViewItem,
} from '@shared/types/caseTypes';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const SupervisorCasesPage: FC = observer(() => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<Case[]>([]);
  const [statistics, setStatistics] = useState<CaseStatistics | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Диалоги
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  
  // Выбранный случай
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [verificationDetails, setVerificationDetails] = useState<CaseVerificationDetails | null>(null);
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [attachments, setAttachments] = useState<CaseAttachment[]>([]);
  const [verificationHistory, setVerificationHistory] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [verificationHistoryLoading, setVerificationHistoryLoading] = useState(false);
  const [caseViewData, setCaseViewData] = useState<CaseViewItem | null>(null);
  const [caseViewLoading, setCaseViewLoading] = useState(false);
  const [attachmentDownloadId, setAttachmentDownloadId] = useState<string | null>(null);
  const [attachmentDeleteId, setAttachmentDeleteId] = useState<string | null>(null);
  
  // Форма верификации
  const [verificationDecision, setVerificationDecision] = useState<'approve' | 'reject'>('approve');
  const [verificationComments, setVerificationComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [newRecommendation, setNewRecommendation] = useState('');
  
  // Фильтры для руководителя
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const [casesData, statsData] = await Promise.all([
        CaseApi.getMyCases(),
        CaseApi.getCaseStatistics(),
      ]);
      setCases(casesData);
      setStatistics(statsData);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseViewDialog = () => {
    setViewDialogOpen(false);
    setCommentsLoading(false);
    setAttachmentsLoading(false);
    setVerificationHistoryLoading(false);
    setCaseViewData(null);
    setCaseViewLoading(false);
    setAttachmentDownloadId(null);
    setAttachmentDeleteId(null);
  };

  const handleOpenCase = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    setViewDialogOpen(true);

    const resolvedCaseId = caseItem.caseId || caseItem.id;
    setComments([]);
    setAttachments([]);
    setVerificationHistory([]);
    setCaseViewData(null);

    setCaseViewLoading(true);
    setCommentsLoading(true);
    setAttachmentsLoading(true);
    setVerificationHistoryLoading(true);

    try {
      const viewData = await CaseApi.getCaseView(resolvedCaseId);
      setCaseViewData(viewData);
    } catch (viewError) {
      console.error('Failed to load cases view data:', viewError);
      setCaseViewData(null);
    } finally {
      setCaseViewLoading(false);
    }

    try {
      const [commentsOutcome, attachmentsOutcome, historyOutcome] = await Promise.allSettled([
        CaseApi.getCaseComments(resolvedCaseId),
        CaseApi.getCaseAttachments(resolvedCaseId),
        CaseApi.getVerificationHistory(resolvedCaseId),
      ]);

      if (commentsOutcome.status === 'fulfilled') {
        setComments(commentsOutcome.value);
      } else {
        console.error('Failed to load case comments:', commentsOutcome.reason);
        setComments([]);
      }

      if (attachmentsOutcome.status === 'fulfilled') {
        setAttachments(attachmentsOutcome.value);
      } else {
        console.error('Failed to load case attachments:', attachmentsOutcome.reason);
        setAttachments([]);
      }

      if (historyOutcome.status === 'fulfilled') {
        setVerificationHistory(historyOutcome.value);
      } else {
        console.error('Failed to load verification history:', historyOutcome.reason);
        setVerificationHistory([]);
      }
    } finally {
      setCommentsLoading(false);
      setAttachmentsLoading(false);
      setVerificationHistoryLoading(false);
    }
  };

  const handleDownloadAttachment = async (attachment: CaseAttachment) => {
    if (!selectedCase?.id) return;
    const caseId = selectedCase.caseId || selectedCase.id;
    setAttachmentDownloadId(attachment.id);
    try {
      await CaseApi.downloadCaseAttachment(caseId, attachment.id, attachment.fileName);
    } catch (error) {
      console.error('Failed to download attachment:', error);
    } finally {
      setAttachmentDownloadId(null);
    }
  };

  const handleDeleteAttachment = async (attachment: CaseAttachment) => {
    if (!selectedCase?.id) return;
    const caseId = selectedCase.caseId || selectedCase.id;
    setAttachmentDeleteId(attachment.id);
    try {
      await CaseApi.deleteCaseAttachment(caseId, attachment.id);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    } finally {
      setAttachmentDeleteId(null);
    }
  };

  const handleOpenVerification = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    
    try {
      const details = await CaseApi.getCaseVerificationDetails(caseItem.id);
      setVerificationDetails(details);
      setVerificationDialogOpen(true);
    } catch (error) {
      console.error('Failed to load verification details:', error);
    }
  };

  const handleVerifyCase = async () => {
    if (!selectedCase) return;
    
    try {
      const decision: VerificationDecision = {
        approved: verificationDecision === 'approve',
        comments: verificationComments,
        rejectionReason: verificationDecision === 'reject' ? rejectionReason : undefined,
        recommendations: recommendations.length > 0 ? recommendations : undefined,
        followUpRequired,
      };
      
      await CaseApi.verifyCase(selectedCase.id, decision);
      await loadCases();
      
      // Закрыть диалоги и сбросить формы
      setVerificationDialogOpen(false);
      resetVerificationForm();
    } catch (error) {
      console.error('Failed to verify case:', error);
    }
  };

  const resetVerificationForm = () => {
    setSelectedCase(null);
    setVerificationDetails(null);
    setVerificationDecision('approve');
    setVerificationComments('');
    setRejectionReason('');
    setFollowUpRequired(false);
    setRecommendations([]);
    setNewRecommendation('');
  };

  const handleAddRecommendation = () => {
    if (newRecommendation.trim()) {
      setRecommendations([...recommendations, newRecommendation.trim()]);
      setNewRecommendation('');
    }
  };

  const handleRemoveRecommendation = (index: number) => {
    setRecommendations(recommendations.filter((_, i) => i !== index));
  };

  const getSeverityColor = (severity: CaseSeverity) => {
    switch (severity) {
      case 'CRITICAL': return 'error';
      case 'HIGH': return 'warning';
      case 'MEDIUM': return 'info';
      case 'LOW': return 'success';
    }
  };

  const getStatusColor = (status: CaseStatus) => {
    switch (status) {
      case 'OPEN': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'INVESTIGATING': return 'primary';
      case 'ACTION_PLAN': return 'warning';
      case 'ACTION_IN_PROGRESS': return 'info';
      case 'WAITING_VERIFICATION': return 'secondary';
      case 'CLOSED': return 'success';
      case 'REJECTED': return 'error';
    }
  };

  const getStatusLabel = (status: CaseStatus) => {
    return getCaseStatusLabelRu(status);
  };

  const stringifyValue = (value: unknown): string => {
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

  const getRiskSeverityLabel = (severity?: string): string => {
    if (!severity) return '-';
    const labels: Record<string, string> = {
      LOW: 'Низкая',
      MEDIUM: 'Средняя',
      HIGH: 'Высокая',
      CRITICAL: 'Критичная',
    };
    return labels[severity.toUpperCase()] || severity;
  };

  const filteredCases = cases.filter(c => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!(c.title.toLowerCase().includes(query) ||
            c.description.toLowerCase().includes(query) ||
            c.id.toLowerCase().includes(query))) {
        return false;
      }
    }
    
    if (filterStatus !== 'all' && c.status !== filterStatus) {
      return false;
    }
    
    if (filterSeverity !== 'all' && c.severity !== filterSeverity) {
      return false;
    }
    
    return true;
  });

  const pendingVerificationCases = filteredCases.filter(c => c.status === 'WAITING_VERIFICATION');
  const activeCases = filteredCases.filter(c => 
    c.status === 'OPEN' ||
    c.status === 'IN_PROGRESS' ||
    c.status === 'INVESTIGATING' ||
    c.status === 'ACTION_PLAN' ||
    c.status === 'ACTION_IN_PROGRESS'
  );
  const completedCases = filteredCases.filter(c => c.status === 'CLOSED' || c.status === 'REJECTED');

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
              Управление случаями
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Контроль и верификация расследований
            </Typography>
          </Box>
          <Badge badgeContent={pendingVerificationCases.length} color="error">
            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={() => setTabValue(0)}
            >
              Ожидают проверки
            </Button>
          </Badge>
        </Box>

        {/* Статистика */}
        {statistics && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card sx={{ cursor: 'pointer' }} onClick={() => setTabValue(0)}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Badge badgeContent={statistics.pendingVerification} color="error">
                    <AssessmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  </Badge>
                  <Typography variant="h5" sx={{ mt: 2 }}>{statistics.pendingVerification}</Typography>
                  <Typography variant="body2" color="text.secondary">На проверке</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="primary">{statistics.inProgress}</Typography>
                  <Typography variant="body2" color="text.secondary">В работе</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="info.main">{statistics.investigation}</Typography>
                  <Typography variant="body2" color="text.secondary">Расследование</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" color="success.main">{statistics.closed}</Typography>
                  <Typography variant="body2" color="text.secondary">Закрыто</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{statistics.avgResolutionTime}ч</Typography>
                  <Typography variant="body2" color="text.secondary">Ср. время</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h5">{statistics.total}</Typography>
                  <Typography variant="body2" color="text.secondary">Всего</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Фильтры и поиск */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Поиск по названию, описанию или ID случая..."
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Статус"
                >
                  <MenuItem value="all">Все статусы</MenuItem>
                  <MenuItem value="WAITING_VERIFICATION">{getCaseStatusLabelRu('WAITING_VERIFICATION')}</MenuItem>
                  <MenuItem value="IN_PROGRESS">{getCaseStatusLabelRu('IN_PROGRESS')}</MenuItem>
                  <MenuItem value="INVESTIGATING">{getCaseStatusLabelRu('INVESTIGATING')}</MenuItem>
                  <MenuItem value="ACTION_PLAN">{getCaseStatusLabelRu('ACTION_PLAN')}</MenuItem>
                  <MenuItem value="ACTION_IN_PROGRESS">{getCaseStatusLabelRu('ACTION_IN_PROGRESS')}</MenuItem>
                  <MenuItem value="CLOSED">{getCaseStatusLabelRu('CLOSED')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Критичность</InputLabel>
                <Select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  label="Критичность"
                >
                  <MenuItem value="all">Все уровни</MenuItem>
                  <MenuItem value="CRITICAL">Критичный</MenuItem>
                  <MenuItem value="HIGH">Высокий</MenuItem>
                  <MenuItem value="MEDIUM">Средний</MenuItem>
                  <MenuItem value="LOW">Низкий</MenuItem>
                </Select>
              </FormControl>
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
                <Badge badgeContent={pendingVerificationCases.length} color="error">
                  <Box sx={{ px: 1 }}>На проверке ({pendingVerificationCases.length})</Box>
                </Badge>
              }
            />
            <Tab label={`Активные (${activeCases.length})`} />
            <Tab label={`Завершенные (${completedCases.length})`} />
          </Tabs>

          {/* Вкладка "На проверке" */}
          <TabPanel value={tabValue} index={0}>
            {pendingVerificationCases.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ApproveIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Нет случаев на проверке
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Название</TableCell>
                      <TableCell>Ответственный</TableCell>
                      <TableCell>Критичность</TableCell>
                      <TableCell>Инцидентов</TableCell>
                      <TableCell>Дата создания</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingVerificationCases.map((caseItem) => (
                      <TableRow key={caseItem.id} hover>
                        <TableCell>{caseItem.id}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {caseItem.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {caseItem.description.substring(0, 60)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {caseItem.ownerName.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{caseItem.ownerName}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getSeverityLabelRu(caseItem.severity)}
                            color={getSeverityColor(caseItem.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={caseItem.incidentIds.length}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(caseItem.createdAt).toLocaleDateString('ru-RU')}
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Просмотр">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenCase(caseItem)}
                            >
                              <ViewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Верифицировать">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenVerification(caseItem)}
                            >
                              <AssessmentIcon fontSize="small" />
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

          {/* Вкладка "Активные" */}
          <TabPanel value={tabValue} index={1}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Ответственный</TableCell>
                    <TableCell>Критичность</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Срок</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeCases.map((caseItem) => (
                    <TableRow key={caseItem.id} hover>
                      <TableCell>{caseItem.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {caseItem.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {caseItem.ownerName.charAt(0)}
                          </Avatar>
                          <Typography variant="body2">{caseItem.ownerName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getSeverityLabelRu(caseItem.severity)}
                          color={getSeverityColor(caseItem.severity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(caseItem.status)}
                          color={getStatusColor(caseItem.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {caseItem.dueDate
                          ? new Date(caseItem.dueDate).toLocaleDateString('ru-RU')
                          : '-'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCase(caseItem)}
                          >
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

          {/* Вкладка "Завершенные" */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Название</TableCell>
                    <TableCell>Ответственный</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Завершен</TableCell>
                    <TableCell>План действий</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {completedCases.map((caseItem) => (
                    <TableRow key={caseItem.id} hover sx={{ opacity: 0.8 }}>
                      <TableCell>{caseItem.id}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {caseItem.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{caseItem.ownerName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(caseItem.status)}
                          color={getStatusColor(caseItem.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(caseItem.updatedAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        {caseItem.actionPlanId ? (
                          <Chip
                            label="Есть план"
                            size="small"
                            color="success"
                            icon={<AssignmentIcon />}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Просмотр">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCase(caseItem)}
                          >
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

        {/* Диалог просмотра случая (как у менеджера) */}
        <Dialog
          open={viewDialogOpen}
          onClose={handleCloseViewDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedCase && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6">{selectedCase.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {selectedCase.id} • Ответственный: {selectedCase.ownerName}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={getSeverityLabelRu(selectedCase.severity)}
                      color={getSeverityColor(selectedCase.severity)}
                      size="small"
                    />
                    <Chip
                      label={getStatusLabel(selectedCase.status)}
                      color={getStatusColor(selectedCase.status)}
                      size="small"
                    />
                  </Box>
                </Box>
              </DialogTitle>

              <DialogContent>
                <Typography variant="body1" paragraph>
                  {selectedCase.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Создан</Typography>
                    <Typography variant="body2">
                      {new Date(selectedCase.createdAt).toLocaleString('ru-RU')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Обновлен</Typography>
                    <Typography variant="body2">
                      {new Date(selectedCase.updatedAt).toLocaleString('ru-RU')}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Связанные инциденты</Typography>
                    <Typography variant="body2">{selectedCase.incidentIds.length}</Typography>
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                    <Typography variant="caption" color="text.secondary">Требует действий</Typography>
                    <Chip
                      label={selectedCase.requiresCorrectiveAction ? 'Да' : 'Нет'}
                      size="small"
                      color={selectedCase.requiresCorrectiveAction ? 'warning' : 'default'}
                    />
                  </Grid>
                </Grid>

                {caseViewLoading && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        py: 4,
                      }}
                    >
                      <CircularProgress size={36} />
                      <Typography variant="body2" color="text.secondary">
                        Загрузка данных правила…
                      </Typography>
                    </Box>
                  </>
                )}
                {!caseViewLoading && caseViewData && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Данные правила
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">Название правила</Typography>
                        <Typography variant="body2">{stringifyValue(caseViewData.ruleName)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">ID правила</Typography>
                        <Typography variant="body2">{stringifyValue(caseViewData.ruleId)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">Условие правила</Typography>
                        <Typography variant="body2">{stringifyValue(caseViewData.ruleCondition)}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="caption" color="text.secondary">
                          Результаты выявления риска
                        </Typography>
                        <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
                          <Grid container spacing={1.5}>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary">Заголовок</Typography>
                              <Typography variant="body2">
                                {stringifyValue((caseViewData.details as Record<string, unknown> | undefined)?.title)}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary">Критичность риска</Typography>
                              <Typography variant="body2">
                                {getRiskSeverityLabel(
                                  stringifyValue(
                                    (caseViewData.details as Record<string, unknown> | undefined)?.severity
                                  )
                                )}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary">Описание</Typography>
                              <Typography variant="body2">
                                {stringifyValue(
                                  (caseViewData.details as Record<string, unknown> | undefined)?.description
                                )}
                              </Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="caption" color="text.secondary">Рекомендация</Typography>
                              <Typography variant="body2">
                                {stringifyValue(
                                  (caseViewData.details as Record<string, unknown> | undefined)?.recommendation
                                )}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    </Grid>
                  </>
                )}

                {selectedCase.investigationNotes && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Заметки по расследованию
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="body2">{selectedCase.investigationNotes}</Typography>
                    </Paper>
                  </>
                )}

                {selectedCase.rootCause && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Первопричина (Root Cause)
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'warning.50' }}>
                      <Typography variant="body2">{selectedCase.rootCause}</Typography>
                    </Paper>
                  </>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Комментарии
                  {!commentsLoading && comments.length > 0 ? ` (${comments.length})` : ''}
                </Typography>
                {commentsLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      py: 3,
                    }}
                  >
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary">
                      Загрузка комментариев…
                    </Typography>
                  </Box>
                ) : comments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Нет комментариев
                  </Typography>
                ) : (
                  <List dense>
                    {comments.slice(0, 3).map((comment) => (
                      <ListItem key={comment.id}>
                        <ListItemAvatar>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {(comment.authorName || '?').charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={comment.authorName || 'Неизвестный автор'}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {comment.content}
                              </Typography>
                              <Typography variant="caption" display="block" color="text.secondary">
                                {comment.createdAt
                                  ? new Date(comment.createdAt).toLocaleString('ru-RU')
                                  : '-'}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  Вложения
                  {!attachmentsLoading && attachments.length > 0 ? ` (${attachments.length})` : ''}
                </Typography>
                {attachmentsLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      py: 3,
                    }}
                  >
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary">
                      Загрузка вложений…
                    </Typography>
                  </Box>
                ) : attachments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Нет вложений
                  </Typography>
                ) : (
                  <List dense>
                    {attachments.map((att) => (
                      <ListItem
                        key={att.id}
                        secondaryAction={
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={
                                attachmentDownloadId === att.id ? (
                                  <CircularProgress size={16} />
                                ) : undefined
                              }
                              onClick={() => void handleDownloadAttachment(att)}
                              disabled={
                                attachmentsLoading ||
                                attachmentDownloadId === att.id ||
                                attachmentDeleteId === att.id
                              }
                            >
                              Скачать
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              startIcon={
                                attachmentDeleteId === att.id ? (
                                  <CircularProgress size={16} color="inherit" />
                                ) : (
                                  <DeleteOutlineIcon />
                                )
                              }
                              onClick={() => void handleDeleteAttachment(att)}
                              disabled={
                                attachmentsLoading ||
                                attachmentDownloadId === att.id ||
                                attachmentDeleteId === att.id
                              }
                            >
                              Удалить
                            </Button>
                          </Stack>
                        }
                      >
                        <ListItemIcon>
                          <AttachIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={att.fileName}
                          secondary={`${(att.fileSize / 1024).toFixed(2)} KB • ${getFileKindShortLabel(att.fileName, att.fileType)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}

                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" gutterBottom>
                  История верификаций
                </Typography>
                {verificationHistoryLoading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 1,
                      py: 3,
                    }}
                  >
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary">
                      Загрузка истории верификаций…
                    </Typography>
                  </Box>
                ) : verificationHistory.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Записей истории верификаций нет
                  </Typography>
                ) : (
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle2">
                        Записей: {verificationHistory.length}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {verificationHistory.map((item, index) => (
                          <ListItem key={index}>
                            <ListItemIcon>
                              {item.approved ? (
                                <ThumbUpIcon color="success" fontSize="small" />
                              ) : (
                                <ThumbDownIcon color="error" fontSize="small" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={item.approved ? 'Утверждено' : 'Отклонено'}
                              secondary={
                                <>
                                  <Typography variant="caption" display="block">
                                    {item.verifiedBy} • {new Date(item.verifiedAt).toLocaleString('ru-RU')}
                                  </Typography>
                                  {item.comments && (
                                    <Typography variant="caption">{item.comments}</Typography>
                                  )}
                                </>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={handleCloseViewDialog}>
                  Закрыть
                </Button>
                {selectedCase.status === 'WAITING_VERIFICATION' && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      handleCloseViewDialog();
                      handleOpenVerification(selectedCase);
                    }}
                    startIcon={<AssessmentIcon />}
                  >
                    Верифицировать
                  </Button>
                )}
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Диалог верификации случая */}
        <Dialog
          open={verificationDialogOpen}
          onClose={() => setVerificationDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedCase && verificationDetails && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Верификация случая</Typography>
                  <Chip label={selectedCase.id} color="primary" />
                </Box>
              </DialogTitle>

              <DialogContent>
                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    <strong>Случай:</strong> {selectedCase.title}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ответственный:</strong> {selectedCase.ownerName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Критичность:</strong> {selectedCase.severity}
                  </Typography>
                </Alert>

                <Stepper orientation="vertical">
                  {/* Шаг 1: Получение уведомления */}
                  <Step active completed>
                    <StepLabel>Получение уведомления о готовности случая к проверке</StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary">
                        Менеджер {selectedCase.ownerName} отправил случай на верификацию
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(selectedCase.updatedAt).toLocaleString('ru-RU')}
                      </Typography>
                    </StepContent>
                  </Step>

                  {/* Шаг 2: Открытие случая */}
                  <Step active completed>
                    <StepLabel>Открытие случая для проверки</StepLabel>
                    <StepContent>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50', mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Резюме расследования
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {verificationDetails.investigationSummary}
                        </Typography>

                        <Typography variant="subtitle2" gutterBottom>
                          Анализ первопричины
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {verificationDetails.rootCauseAnalysis}
                        </Typography>

                        <Typography variant="subtitle2" gutterBottom>
                          Предоставленные доказательства
                        </Typography>
                        <List dense>
                          {verificationDetails.evidenceProvided.map((evidence, idx) => (
                            <ListItem key={idx}>
                              <ListItemIcon>
                                <ApproveIcon color="success" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText primary={evidence} />
                            </ListItem>
                          ))}
                        </List>
                      </Paper>
                    </StepContent>
                  </Step>

                  {/* Шаг 3: Просмотр исполнения */}
                  <Step active completed>
                    <StepLabel>Просмотр исполнения и соответствия корректирующих действий</StepLabel>
                    <StepContent>
                      {verificationDetails.proposedActions.length > 0 ? (
                        <TableContainer component={Paper} sx={{ mb: 2 }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Задача</TableCell>
                                <TableCell>Ответственный</TableCell>
                                <TableCell>Срок</TableCell>
                                <TableCell>Статус</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {verificationDetails.proposedActions.map((action, idx) => (
                                <TableRow key={idx}>
                                  <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                      {action.taskTitle}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {action.description}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>{action.assignee}</TableCell>
                                  <TableCell>
                                    {new Date(action.dueDate).toLocaleDateString('ru-RU')}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      label={getTaskStatusLabelRu(action.status)}
                                      size="small"
                                      color={action.status === 'DONE' ? 'success' : 'default'}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                          Корректирующие действия не требуются для данного случая
                        </Alert>
                      )}

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">
                            Оценка влияния
                          </Typography>
                          <Typography variant="body2">
                            {verificationDetails.estimatedImpact}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">
                            Превентивные меры
                          </Typography>
                          <Typography variant="body2">
                            {verificationDetails.preventiveMeasures}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary">
                            Требуемые ресурсы
                          </Typography>
                          <Typography variant="body2">
                            {verificationDetails.resourcesRequired}
                          </Typography>
                        </Grid>
                      </Grid>
                    </StepContent>
                  </Step>

                  {/* Шаг 4: Принятие решения */}
                  <Step active>
                    <StepLabel>Решение: Одобрить или Отклонить</StepLabel>
                    <StepContent>
                      <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Решение</InputLabel>
                        <Select
                          value={verificationDecision}
                          onChange={(e) => setVerificationDecision(e.target.value as 'approve' | 'reject')}
                          label="Решение"
                        >
                          <MenuItem value="approve">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <ApproveIcon color="success" />
                              <Typography>Утвердить</Typography>
                            </Box>
                          </MenuItem>
                          <MenuItem value="reject">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <RejectIcon color="error" />
                              <Typography>Отклонить</Typography>
                            </Box>
                          </MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        fullWidth
                        label="Комментарии"
                        multiline
                        rows={3}
                        value={verificationComments}
                        onChange={(e) => setVerificationComments(e.target.value)}
                        placeholder="Добавьте свои комментарии к решению..."
                        sx={{ mb: 2 }}
                      />

                      {verificationDecision === 'reject' && (
                        <TextField
                          fullWidth
                          label="Причина отклонения"
                          multiline
                          rows={3}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Укажите подробную причину отклонения..."
                          required
                          sx={{ mb: 2 }}
                        />
                      )}

                      {verificationDecision === 'approve' && (
                        <>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={followUpRequired}
                                onChange={(e) => setFollowUpRequired(e.target.checked)}
                              />
                            }
                            label="Требуется последующий контроль"
                            sx={{ mb: 2 }}
                          />

                          <Typography variant="subtitle2" gutterBottom>
                            Рекомендации для команды (опционально)
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            <TextField
                              fullWidth
                              size="small"
                              placeholder="Добавить рекомендацию..."
                              value={newRecommendation}
                              onChange={(e) => setNewRecommendation(e.target.value)}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddRecommendation();
                                }
                              }}
                              InputProps={{
                                endAdornment: (
                                  <Button
                                    size="small"
                                    onClick={handleAddRecommendation}
                                    disabled={!newRecommendation.trim()}
                                  >
                                    Добавить
                                  </Button>
                                ),
                              }}
                            />
                          </Box>

                          {recommendations.length > 0 && (
                            <List dense>
                              {recommendations.map((rec, idx) => (
                                <ListItem
                                  key={idx}
                                  secondaryAction={
                                    <IconButton
                                      edge="end"
                                      size="small"
                                      onClick={() => handleRemoveRecommendation(idx)}
                                    >
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  }
                                >
                                  <ListItemIcon>
                                    <FlagIcon fontSize="small" color="primary" />
                                  </ListItemIcon>
                                  <ListItemText primary={rec} />
                                </ListItem>
                              ))}
                            </List>
                          )}
                        </>
                      )}
                    </StepContent>
                  </Step>
                </Stepper>
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setVerificationDialogOpen(false)}>
                  Отмена
                </Button>
                <Button
                  variant="contained"
                  color={verificationDecision === 'approve' ? 'success' : 'error'}
                  onClick={handleVerifyCase}
                  disabled={
                    !verificationComments.trim() ||
                    (verificationDecision === 'reject' && !rejectionReason.trim())
                  }
                  startIcon={verificationDecision === 'approve' ? <ApproveIcon /> : <RejectIcon />}
                >
                  {verificationDecision === 'approve' ? 'Утвердить' : 'Отклонить'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
});
