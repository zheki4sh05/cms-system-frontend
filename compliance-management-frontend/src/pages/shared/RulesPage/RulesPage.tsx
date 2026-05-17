import { type FC, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RuleIcon from '@mui/icons-material/Rule';
import CategoryIcon from '@mui/icons-material/Category';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import RadarIcon from '@mui/icons-material/Radar';
import CloseIcon from '@mui/icons-material/Close';
import type { RulesListItem } from '@shared/types/rulesTypes';
import { RuleApi } from '@shared/lib/api/ruleApi';
import {
  getIncidentCategoryLabelRu,
  getRuleDisplaySeverityLabelRu,
  getRuleLifecycleStatusRu,
} from '@shared/lib/domainLabelsRu';

const formatDate = (value?: string): string => {
  if (!value) {
    return 'Нет данных';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('ru-RU');
};

export const RulesPage: FC = () => {
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<RulesListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRule, setSelectedRule] = useState<RulesListItem | null>(null);

  useEffect(() => {
    const loadRules = async () => {
      try {
        setLoading(true);
        const data = await RuleApi.getAllRules();
        setRules(data);
      } catch (error) {
        console.error('Failed to load rules list:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRules();
  }, []);

  const filteredRules = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return rules;
    }

    return rules.filter((rule) => rule.name.toLowerCase().includes(normalizedQuery));
  }, [rules, searchQuery]);

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Правила
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Единый реестр правил контроля для всех ролей
        </Typography>

        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Поиск по наименованию правила..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            helperText={`Найдено правил: ${filteredRules.length}`}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {!filteredRules.length && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Правила не найдены по заданному наименованию.
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Категория</TableCell>
                <TableCell>Серьёзность</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Изменено</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>{rule.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>{getIncidentCategoryLabelRu(rule.categoryLabel)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getRuleDisplaySeverityLabelRu(rule.priority, rule.severity)}
                      size="small"
                      color="info"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.enabled ? 'Активно' : 'Отключено'}
                      color={rule.enabled ? 'success' : 'default'}
                      size="small"
                      variant={rule.enabled ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>{formatDate(rule.riskObject?.updatedAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Просмотр">
                      <IconButton size="small" color="primary" onClick={() => setSelectedRule(rule)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog
        open={Boolean(selectedRule)}
        onClose={() => setSelectedRule(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedRule && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <RuleIcon color="primary" fontSize="small" />
                  <Typography variant="h6">{selectedRule.name}</Typography>
                </Stack>
                <IconButton
                  size="small"
                  aria-label="Закрыть окно"
                  onClick={() => setSelectedRule(null)}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ pb: 3 }}>
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <CategoryIcon color="action" fontSize="small" />
                    <Typography variant="subtitle2">Основная информация</Typography>
                  </Stack>
                  <Typography variant="body2">ID: {selectedRule.id}</Typography>
                  <Typography variant="body2">Категория: {getIncidentCategoryLabelRu(selectedRule.categoryLabel)}</Typography>
                  <Typography variant="body2">
                    Серьёзность: {getRuleDisplaySeverityLabelRu(selectedRule.priority, selectedRule.severity)}
                  </Typography>
                  <Typography variant="body2">
                    Статус: {selectedRule.enabled ? 'Активно' : 'Отключено'}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <PriorityHighIcon color="action" fontSize="small" />
                    <Typography variant="subtitle2">Логика правила</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Условие:
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {selectedRule.condition}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Действие:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRule.action}
                  </Typography>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <RadarIcon color="action" fontSize="small" />
                    <Typography variant="subtitle2">Объект риска</Typography>
                  </Stack>
                  <Typography variant="body2">Risk Object ID: {selectedRule.riskObjectId}</Typography>
                  <Typography variant="body2">Код: {selectedRule.riskObject?.code || '-'}</Typography>
                  <Typography variant="body2">Название: {selectedRule.riskObject?.name || '-'}</Typography>
                  <Typography variant="body2">Статус: {getRuleLifecycleStatusRu(selectedRule.riskObject?.status)}</Typography>
                  <Typography variant="body2">
                    Обновлено: {formatDate(selectedRule.riskObject?.updatedAt)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Описание:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedRule.riskObject?.definition || '-'}
                  </Typography>
                </Paper>
              </Stack>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Container>
  );
};
