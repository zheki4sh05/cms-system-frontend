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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { CaseApi } from '@shared/lib/api/caseApi';
import {
  CaseSeverity,
  type Case,
  CaseStatus,
  type CasePriority,
  type CaseComment,
  type CaseAttachment,
  type CaseStatistics,
  type CaseVerificationDetails,
  type VerificationDecision,
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

  const handleOpenCase = async (caseItem: Case) => {
    setSelectedCase(caseItem);
    setViewDialogOpen(true);
    
    try {
      const [commentsData, attachmentsData, historyData] = await Promise.all([
        CaseApi.getCaseComments(caseItem.id),
        CaseApi.getCaseAttachments(caseItem.id),
        CaseApi.getVerificationHistory(caseItem.id),
      ]);
      setComments(commentsData);
      setAttachments(attachmentsData);
      setVerificationHistory(historyData);
    } catch (error) {
      console.error('Failed to load case details:', error);
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
      case 'INVESTIGATION': return 'primary';
      case 'ACTION_PLAN': return 'warning';
      case 'PENDING_VERIFICATION': return 'secondary';
      case 'CLOSED': return 'success';
      case 'REJECTED': return 'error';
    }
  };

  const getStatusLabel = (status: CaseStatus) => {
    const labels = {
      OPEN: 'Открыт',
      IN_PROGRESS: 'В работе',
      INVESTIGATION: 'Расследование',
      ACTION_PLAN: 'План действий',
      PENDING_VERIFICATION: 'На проверке',
      CLOSED: 'Закрыт',
      REJECTED: 'Отклонен',
      ESCALATED_TO_CASE: 'Эскалация'
    };
    return labels[status];
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

  const pendingVerificationCases = filteredCases.filter(c => c.status === 'PENDING_VERIFICATION');
  const activeCases = filteredCases.filter(c => 
    c.status === 'OPEN' ||
    c.status === 'IN_PROGRESS' ||
    c.status === 'INVESTIGATION' ||
    c.status === 'ACTION_PLAN'
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
                  <MenuItem value="PENDING_VERIFICATION">На проверке</MenuItem>
                  <MenuItem value="IN_PROGRESS">В работе</MenuItem>
                  <MenuItem value="INVESTIGATION">Расследование</MenuItem>
                  <MenuItem value="ACTION_PLAN">План действий</MenuItem>
                  <MenuItem value="CLOSED">Закрыто</MenuItem>
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
                            label={caseItem.severity}
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
                          label={caseItem.severity}
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
          onClose={() => setViewDialogOpen(false)}
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
                      label={selectedCase.severity}
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

                {comments.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Комментарии ({comments.length})
                    </Typography>
                    <List dense>
                      {comments.slice(0, 3).map((comment) => (
                        <ListItem key={comment.id}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 32, height: 32 }}>
                              {comment.authorName.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={comment.authorName}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {comment.content}
                                </Typography>
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {new Date(comment.createdAt).toLocaleString('ru-RU')}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {attachments.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Вложения ({attachments.length})
                    </Typography>
                    <List dense>
                      {attachments.map((att) => (
                        <ListItem key={att.id}>
                          <ListItemIcon>
                            <AttachIcon fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={att.fileName}
                            secondary={`${(att.fileSize / 1024).toFixed(2)} KB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {verificationHistory.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2">
                          История верификаций ({verificationHistory.length})
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
                  </>
                )}
              </DialogContent>

              <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button onClick={() => setViewDialogOpen(false)}>
                  Закрыть
                </Button>
                {selectedCase.status === 'PENDING_VERIFICATION' && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      setViewDialogOpen(false);
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
                                      label={action.status}
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
