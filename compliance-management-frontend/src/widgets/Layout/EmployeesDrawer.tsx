import { type FC, useCallback, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
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
import { useAuthStore } from '@features/auth/useAuthStore';
import { InviteEmployeeDialog } from './InviteEmployeeDialog';
import { type User, type UserRole, UserRoleValues } from '@shared/types/customTypes';
import { InvitationApi } from '@shared/lib/api/invitationApi';
import { CompanyApi } from '@shared/lib/api/companyApi';
import { DepartmentApi } from '@shared/lib/api/departmentApi';
import { EmployeeApi } from '@shared/lib/api/employeeApi';

interface EmployeesDrawerProps {
  open: boolean;
  onClose: () => void;
}

interface EmployeeListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department?: string;
  phone?: string;
}

export const EmployeesDrawer: FC<EmployeesDrawerProps> = observer(({ open, onClose }) => {
  const authStore = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const filteredEmployees = employees.filter(emp =>
    emp.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Проверка прав на добавление сотрудников
  const canInviteEmployees = authStore.isExecutive || authStore.isSupervisor;

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRoleValues.MANAGER:
        return 'Менеджер';
      case UserRoleValues.SUPERVISOR:
        return 'Руководитель';
      case UserRoleValues.EXECUTIVE:
        return 'ТОП-менеджмент';
      default:
        return role;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRoleValues.MANAGER:
        return 'primary';
      case UserRoleValues.SUPERVISOR:
        return 'secondary';
      case UserRoleValues.EXECUTIVE:
        return 'error';
      default:
        return 'default';
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const loadEmployees = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      let companyId = authStore.user?.companyId;
      if (!companyId) {
        const company = await CompanyApi.getCompany();
        companyId = company.id;
      }
      if (!companyId) {
        setEmployees([]);
        setLoadError('Не удалось определить компанию');
        return;
      }

      const [users, departments] = await Promise.all([
        EmployeeApi.getEmployeesByCompanyId(companyId),
        DepartmentApi.getDepartmentsByCompanyId(companyId),
      ]);

      const departmentMap = new Map(departments.map((d) => [d.id, d.name]));
      const mapped: EmployeeListItem[] = users.map((u: User) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role,
        roleLabel: getRoleLabel(u.role),
        department: u.departmentId ? departmentMap.get(u.departmentId) ?? u.departmentId : undefined,
      }));

      setEmployees(mapped);
    } catch (error) {
      console.error('Failed to load employees:', error);
      setEmployees([]);
      setLoadError('Не удалось загрузить список сотрудников');
    } finally {
      setIsLoading(false);
    }
  }, [authStore.user?.companyId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    void loadEmployees();
  }, [open, loadEmployees]);

  // Обработка отправки приглашения
  const handleInvite = async (email: string, role: UserRole, departmentId?: string) => {
    if (!authStore.user?.id) {
      throw new Error('Не удалось определить текущего пользователя');
    }

    await InvitationApi.sendInvitation({
      email,
      role,
      departmentId,
      invitedBy: authStore.user.id,
    });
    await loadEmployees();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '80%',
            maxWidth: 800,
          },
        }}
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
          {loadError && (
            <Paper
              sx={{
                p: 2,
                mb: 3,
                bgcolor: 'error.lighter',
                border: '1px solid',
                borderColor: 'error.light',
              }}
            >
              <Typography variant="body2" color="error.main">
                {loadError}
              </Typography>
            </Paper>
          )}

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

            {/* Кнопка добавления (только для Executive и Supervisor) */}
            {canInviteEmployees && (
              <Button
                variant="contained"
                startIcon={<PersonAddOutlined />}
                onClick={() => setInviteDialogOpen(true)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Пригласить
              </Button>
            )}
          </Stack>

          {/* Info alert для менеджеров */}
          {authStore.isManager && (
            <Paper 
              sx={{ 
                p: 2, 
                mb: 3, 
                bgcolor: 'info.lighter',
                border: '1px solid',
                borderColor: 'info.light',
              }}
            >
              <Typography variant="body2" color="info.dark">
                ℹ️ Для добавления новых сотрудников обратитесь к руководителю или 
                в отдел кадров.
              </Typography>
            </Paper>
          )}

          {/* Employees List */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Найдено сотрудников: {filteredEmployees.length}
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Загрузка...
              </Typography>
            </Box>
          ) : (
          <List sx={{ bgcolor: 'background.paper' }}>
            {filteredEmployees.map((employee) => (
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
                            {employee.phone ?? '—'}
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
          )}

          {filteredEmployees.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Сотрудники не найдены
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Диалог приглашения */}
      <InviteEmployeeDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInvite}
      />
    </>
  );
});