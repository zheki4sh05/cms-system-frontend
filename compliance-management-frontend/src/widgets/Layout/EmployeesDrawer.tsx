import { type FC, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Button,
  Stack,
  Paper,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  PersonAddOutlined,
  EmailOutlined,
  PhoneOutlined,
  BusinessOutlined,
} from '@mui/icons-material';

interface EmployeesDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Моковые данные сотрудников
const mockEmployees = [
  {
    id: '1',
    firstName: 'Иван',
    lastName: 'Менеджеров',
    email: 'manager@example.com',
    role: 'MANAGER',
    roleLabel: 'Менеджер по закупкам',
    department: 'dept-001',
    phone: '+7 (495) 123-45-67',
  },
  {
    id: '2',
    firstName: 'Петр',
    lastName: 'Руководителев',
    email: 'supervisor@example.com',
    role: 'SUPERVISOR',
    roleLabel: 'Руководитель закупок',
    department: 'dept-001',
    phone: '+7 (495) 123-45-68',
  },
  {
    id: '3',
    firstName: 'Анна',
    lastName: 'Директорова',
    email: 'executive@example.com',
    role: 'EXECUTIVE',
    roleLabel: 'ТОП-менеджмент',
    department: undefined,
    phone: '+7 (495) 123-45-69',
  },
];

export const EmployeesDrawer: FC<EmployeesDrawerProps> = ({ open, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = mockEmployees.filter(emp => 
    emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'MANAGER':
        return 'primary';
      case 'SUPERVISOR':
        return 'secondary';
      case 'EXECUTIVE':
        return 'error';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
    >
      {/* Header */}
      <Box
        sx={{
          p: 3,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            Сотрудники
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Управление пользователями системы
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box sx={{ p: 3 }}>
        {/* Search and Add */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <TextField
            placeholder="Поиск сотрудников..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            startIcon={<PersonAddOutlined />}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Добавить
          </Button>
        </Stack>

        {/* Employees List */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
          Найдено сотрудников: {filteredEmployees.length}
        </Typography>

        <List sx={{ bgcolor: 'background.paper' }}>
          {filteredEmployees.map((employee, index) => (
            <Paper
              key={employee.id}
              variant="outlined"
              sx={{ mb: 2, overflow: 'hidden' }}
            >
              <ListItem
                alignItems="flex-start"
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      fontSize: '1.2rem',
                    }}
                  >
                    {getInitials(employee.firstName, employee.lastName)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" component="span">
                        {employee.firstName} {employee.lastName}
                      </Typography>
                      <Chip
                        label={employee.roleLabel}
                        size="small"
                        color={getRoleColor(employee.role)}
                      />
                    </Box>
                  }
                  secondary={
                    <Stack spacing={0.5} sx={{ mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailOutlined fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {employee.email}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneOutlined fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {employee.phone}
                        </Typography>
                      </Box>
                      {employee.department && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <BusinessOutlined fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Отдел: {employee.department}
                          </Typography>
                        </Box>
                      )}
                    </Stack>
                  }
                />
              </ListItem>
            </Paper>
          ))}
        </List>

        {filteredEmployees.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Сотрудники не найдены
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};