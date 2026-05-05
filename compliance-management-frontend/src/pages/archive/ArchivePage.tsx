import { type FC, useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  ArchiveApi,
  type ArchiveCaseItem,
  type ArchiveIncidentItem,
  type ArchiveNonComplianceItem,
  type ArchivePlanItem,
} from '@shared/lib/api/archiveApi';
import { CASE_STATUS_LABELS_RU, INCIDENT_STATUS_LABELS_RU } from '@shared/lib/statusLabels';

type ArchiveTab = 'incidents' | 'nonCompliance' | 'cases' | 'investigationPlans';

const incidentStatusLabel: Record<string, string> = {
  RESOLVED: INCIDENT_STATUS_LABELS_RU.RESOLVED,
  FALSE_POSITIVE: INCIDENT_STATUS_LABELS_RU.FALSE_POSITIVE,
  ESCALATED_TO_CASE: INCIDENT_STATUS_LABELS_RU.ESCALATED_TO_CASE,
};

const caseStatusLabel: Record<string, string> = {
  OPEN: CASE_STATUS_LABELS_RU.OPEN,
  IN_PROGRESS: CASE_STATUS_LABELS_RU.IN_PROGRESS,
  INVESTIGATING: CASE_STATUS_LABELS_RU.INVESTIGATING,
  ACTION_PLAN: CASE_STATUS_LABELS_RU.ACTION_PLAN,
  ACTION_IN_PROGRESS: CASE_STATUS_LABELS_RU.ACTION_IN_PROGRESS,
  WAITING_VERIFICATION: CASE_STATUS_LABELS_RU.WAITING_VERIFICATION,
  CLOSED: CASE_STATUS_LABELS_RU.CLOSED,
  REJECTED: CASE_STATUS_LABELS_RU.REJECTED,
  ESCALATED_TO_CASE: CASE_STATUS_LABELS_RU.ESCALATED_TO_CASE,
};

const planStatusLabel: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING_APPROVAL: 'На утверждении',
  APPROVED: 'Утвержден',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершен',
  REJECTED: 'Отклонен',
};

export const ArchivePage: FC = observer(() => {
  const [tab, setTab] = useState<ArchiveTab>('incidents');
  const [incidents, setIncidents] = useState<ArchiveIncidentItem[]>([]);
  const [nonComplianceItems, setNonComplianceItems] = useState<ArchiveNonComplianceItem[]>([]);
  const [cases, setCases] = useState<ArchiveCaseItem[]>([]);
  const [plans, setPlans] = useState<ArchivePlanItem[]>([]);

  const [searchIncident, setSearchIncident] = useState('');
  const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('all');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('all');

  const [searchNonCompliance, setSearchNonCompliance] = useState('');
  const [nonComplianceSourceFilter, setNonComplianceSourceFilter] = useState('all');
  const [nonComplianceSeverityFilter, setNonComplianceSeverityFilter] = useState('all');

  const [searchCases, setSearchCases] = useState('');
  const [caseStatusFilter, setCaseStatusFilter] = useState('all');
  const [casePriorityFilter, setCasePriorityFilter] = useState('all');

  const [searchPlans, setSearchPlans] = useState('');
  const [planStatusFilter, setPlanStatusFilter] = useState('all');
  const [planProgressFilter, setPlanProgressFilter] = useState('all');

  useEffect(() => {
    const loadArchiveData = async () => {
      try {
        const incidentsParams = new URLSearchParams({
          q: searchIncident,
          severity: incidentSeverityFilter,
          status: incidentStatusFilter,
        });
        const nonComplianceParams = new URLSearchParams({
          q: searchNonCompliance,
          source: nonComplianceSourceFilter,
          severity: nonComplianceSeverityFilter,
        });
        const caseParams = new URLSearchParams({
          q: searchCases,
          status: caseStatusFilter,
          priority: casePriorityFilter,
        });
        const planParams = new URLSearchParams({
          q: searchPlans,
          status: planStatusFilter,
          progress: planProgressFilter,
        });

        const [incidentsData, nonComplianceData, casesData, plansData] = await Promise.all([
          ArchiveApi.getArchivedIncidents(incidentsParams),
          ArchiveApi.getArchivedNonCompliance(nonComplianceParams),
          ArchiveApi.getArchivedCases(caseParams),
          ArchiveApi.getArchivedPlans(planParams),
        ]);

        setIncidents(incidentsData);
        setNonComplianceItems(nonComplianceData);
        setCases(casesData);
        setPlans(plansData);
      } catch (error) {
        console.error('Failed to load archive data:', error);
      }
    };

    void loadArchiveData();
  }, [
    searchIncident,
    incidentSeverityFilter,
    incidentStatusFilter,
    searchNonCompliance,
    nonComplianceSourceFilter,
    nonComplianceSeverityFilter,
    searchCases,
    caseStatusFilter,
    casePriorityFilter,
    searchPlans,
    planStatusFilter,
    planProgressFilter,
  ]);

  const filteredIncidents = useMemo(
    () => incidents,
    [incidents]
  );

  const filteredNonCompliance = useMemo(
    () => nonComplianceItems,
    [nonComplianceItems]
  );

  const filteredCases = useMemo(
    () => cases,
    [cases]
  );

  const filteredPlans = useMemo(
    () => plans,
    [plans]
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Архив
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Поиск и просмотр завершенных инцидентов, несоответствий, случаев и планов расследования.
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Архив инцидентов
                </Typography>
                <Typography variant="h5">{filteredIncidents.length}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Несоответствия
                </Typography>
                <Typography variant="h5">{nonComplianceItems.length}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Закрытые случаи
                </Typography>
                <Typography variant="h5">{filteredCases.length}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Планы расследования
                </Typography>
                <Typography variant="h5">{filteredPlans.length}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Paper>
          <Tabs
            value={tab}
            onChange={(_, value: ArchiveTab) => setTab(value)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab value="incidents" label={`Инциденты (${filteredIncidents.length})`} />
            <Tab value="nonCompliance" label={`Несоответствия (${filteredNonCompliance.length})`} />
            <Tab value="cases" label={`Случаи (${filteredCases.length})`} />
            <Tab value="investigationPlans" label={`Планы расследования (${filteredPlans.length})`} />
          </Tabs>

          <Box sx={{ p: 2 }}>
            {tab === 'incidents' && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      placeholder="Поиск по инцидентам"
                      value={searchIncident}
                      onChange={event => setSearchIncident(event.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Критичность</InputLabel>
                      <Select
                        value={incidentSeverityFilter}
                        label="Критичность"
                        onChange={event => setIncidentSeverityFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="CRITICAL">Критичная</MenuItem>
                        <MenuItem value="HIGH">Высокая</MenuItem>
                        <MenuItem value="MEDIUM">Средняя</MenuItem>
                        <MenuItem value="LOW">Низкая</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Статус</InputLabel>
                      <Select
                        value={incidentStatusFilter}
                        label="Статус"
                        onChange={event => setIncidentStatusFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="RESOLVED">Решен</MenuItem>
                        <MenuItem value="FALSE_POSITIVE">Ложное срабатывание</MenuItem>
                        <MenuItem value="ESCALATED_TO_CASE">Эскалирован</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Название</TableCell>
                        <TableCell>Критичность</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Дата</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredIncidents.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.severity}</TableCell>
                          <TableCell>{incidentStatusLabel[item.status] ?? item.status}</TableCell>
                          <TableCell>{new Date(item.resolvedAt).toLocaleDateString('ru-RU')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {tab === 'nonCompliance' && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      placeholder="Поиск по несоответствиям"
                      value={searchNonCompliance}
                      onChange={event => setSearchNonCompliance(event.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Источник</InputLabel>
                      <Select
                        value={nonComplianceSourceFilter}
                        label="Источник"
                        onChange={event => setNonComplianceSourceFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="Комплаенс-контроль">Комплаенс-контроль</MenuItem>
                        <MenuItem value="Качество данных">Качество данных</MenuItem>
                        <MenuItem value="Правило мониторинга">Правило мониторинга</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Критичность</InputLabel>
                      <Select
                        value={nonComplianceSeverityFilter}
                        label="Критичность"
                        onChange={event => setNonComplianceSeverityFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="CRITICAL">Критичная</MenuItem>
                        <MenuItem value="HIGH">Высокая</MenuItem>
                        <MenuItem value="MEDIUM">Средняя</MenuItem>
                        <MenuItem value="LOW">Низкая</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Описание</TableCell>
                        <TableCell>Источник</TableCell>
                        <TableCell>Категория</TableCell>
                        <TableCell>Критичность</TableCell>
                        <TableCell>Дата</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredNonCompliance.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>
                            <Chip size="small" label={item.severity} />
                          </TableCell>
                          <TableCell>{new Date(item.date).toLocaleDateString('ru-RU')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {tab === 'cases' && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      placeholder="Поиск по случаям"
                      value={searchCases}
                      onChange={event => setSearchCases(event.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Статус</InputLabel>
                      <Select
                        value={caseStatusFilter}
                        label="Статус"
                        onChange={event => setCaseStatusFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="CLOSED">Закрыт</MenuItem>
                        <MenuItem value="REJECTED">Отклонен</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Приоритет</InputLabel>
                      <Select
                        value={casePriorityFilter}
                        label="Приоритет"
                        onChange={event => setCasePriorityFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="LOW">Низкий</MenuItem>
                        <MenuItem value="NORMAL">Средний</MenuItem>
                        <MenuItem value="HIGH">Высокий</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Название</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Приоритет</TableCell>
                        <TableCell>Ответственный</TableCell>
                        <TableCell>Обновлен</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredCases.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.id}</TableCell>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{caseStatusLabel[item.status] ?? item.status}</TableCell>
                          <TableCell>{item.priority}</TableCell>
                          <TableCell>{item.ownerName}</TableCell>
                          <TableCell>{new Date(item.updatedAt).toLocaleDateString('ru-RU')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            {tab === 'investigationPlans' && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      placeholder="Поиск по планам расследования"
                      value={searchPlans}
                      onChange={event => setSearchPlans(event.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Статус плана</InputLabel>
                      <Select
                        value={planStatusFilter}
                        label="Статус плана"
                        onChange={event => setPlanStatusFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="COMPLETED">Завершен</MenuItem>
                        <MenuItem value="REJECTED">Отклонен</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, md: 3 }}>
                    <FormControl fullWidth>
                      <InputLabel>Прогресс</InputLabel>
                      <Select
                        value={planProgressFilter}
                        label="Прогресс"
                        onChange={event => setPlanProgressFilter(event.target.value)}
                      >
                        <MenuItem value="all">Все</MenuItem>
                        <MenuItem value="full">100%</MenuItem>
                        <MenuItem value="partial">Менее 100%</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>План</TableCell>
                        <TableCell>Случай</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Прогресс</TableCell>
                        <TableCell>Задач</TableCell>
                        <TableCell>Создан</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredPlans.map(item => (
                        <TableRow key={item.id}>
                          <TableCell>{item.title}</TableCell>
                          <TableCell>{item.caseTitle}</TableCell>
                          <TableCell>{planStatusLabel[item.status] ?? item.status}</TableCell>
                          <TableCell>{item.progressPercentage}%</TableCell>
                          <TableCell>
                            {item.completedTasks}/{item.totalTasks}
                          </TableCell>
                          <TableCell>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
});
