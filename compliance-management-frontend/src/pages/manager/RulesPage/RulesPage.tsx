
import { type FC } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';

interface Rule {
  id: string;
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'INACTIVE';
  category: string;
  lastModified: string;
}

const mockRules: Rule[] = [
  {
    id: 'rule-001',
    name: 'Превышение бюджета закупки',
    description: 'Срабатывает при превышении суммы закупки над утвержденным бюджетом',
    severity: 'HIGH',
    status: 'ACTIVE',
    category: 'Финансовый контроль',
    lastModified: '2024-11-28',
  },
  {
    id: 'rule-002',
    name: 'Дублирование поставщика',
    description: 'Обнаружение дублирующих записей поставщиков',
    severity: 'MEDIUM',
    status: 'ACTIVE',
    category: 'Контрагенты',
    lastModified: '2024-11-25',
  },
  {
    id: 'rule-003',
    name: 'Конфликт интересов',
    description: 'Выявление потенциальных конфликтов интересов',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    category: 'Комплаенс',
    lastModified: '2024-11-20',
  },
  {
    id: 'rule-004',
    name: 'Задержка поставки',
    description: 'Фиксация просроченных поставок',
    severity: 'LOW',
    status: 'INACTIVE',
    category: 'Логистика',
    lastModified: '2024-11-15',
  },
];

const getSeverityColor = (severity: Rule['severity']) => {
  switch (severity) {
    case 'CRITICAL':
      return 'error';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'info';
    case 'LOW':
      return 'success';
  }
};

const getSeverityLabel = (severity: Rule['severity']) => {
  switch (severity) {
    case 'CRITICAL':
      return 'Критический';
    case 'HIGH':
      return 'Высокий';
    case 'MEDIUM':
      return 'Средний';
    case 'LOW':
      return 'Низкий';
  }
};

export const ManagerRulesPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Правила мониторинга
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
          >
            Создать правило
          </Button>
        </Box>

        {/* Статистика */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid  size={{xs: 12, sm: 6, md: 3}}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="primary">
                {mockRules.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Всего правил
              </Typography>
            </Paper>
          </Grid>
          <Grid  size={{xs: 12, sm: 6, md: 3}}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="success.main">
                {mockRules.filter(r => r.status === 'ACTIVE').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Активных
              </Typography>
            </Paper>
          </Grid>
          <Grid  size={{xs: 12, sm: 6, md: 3}}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="error.main">
                {mockRules.filter(r => r.severity === 'CRITICAL').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Критических
              </Typography>
            </Paper>
          </Grid>
          <Grid  size={{xs: 12, sm: 6, md: 3}}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h3" color="text.secondary">
                {mockRules.filter(r => r.status === 'INACTIVE').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Неактивных
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Поиск */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Поиск правил по названию, описанию или категории..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        {/* Таблица правил */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Название</TableCell>
                <TableCell>Категория</TableCell>
                <TableCell>Критичность</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Изменено</TableCell>
                <TableCell align="right">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockRules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>{rule.id}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {rule.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {rule.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{rule.category}</TableCell>
                  <TableCell>
                    <Chip
                      label={getSeverityLabel(rule.severity)}
                      color={getSeverityColor(rule.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.status === 'ACTIVE' ? 'Активно' : 'Неактивно'}
                      color={rule.status === 'ACTIVE' ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{rule.lastModified}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="info">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};
