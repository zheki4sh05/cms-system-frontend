import { type FC, useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { PersonAddOutlined } from '@mui/icons-material';
import type { UserRole } from '@shared/types/customTypes';
import { UserRoleValues } from '@shared/types/customTypes';
import { useAuthStore } from '@features/auth/useAuthStore';
import { CompanyApi } from '@shared/lib/api/companyApi';
import { DepartmentApi } from '@shared/lib/api/departmentApi';
import type { Department } from '@shared/types/departmentTypes';

interface InviteEmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole, departmentId?: string) => Promise<void>;
}

export const InviteEmployeeDialog: FC<InviteEmployeeDialogProps> = observer(({
  open,
  onClose,
  onInvite,
}) => {
  const authStore = useAuthStore();

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRoleValues.MANAGER);
  const [departmentId, setDepartmentId] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Определение доступных ролей в зависимости от роли приглашающего
  const getAvailableRoles = (): UserRole[] => {
    if (authStore.isExecutive) {
      // Топ-менеджмент может приглашать на любую роль
      return [UserRoleValues.MANAGER, UserRoleValues.SUPERVISOR, UserRoleValues.EXECUTIVE];
    } else if (authStore.isSupervisor) {
      // Руководитель может приглашать только менеджеров
      return [UserRoleValues.MANAGER];
    }
    return [];
  };

  // Получение названия роли на русском
  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case UserRoleValues.MANAGER:
        return 'Менеджер по закупкам';
      case UserRoleValues.SUPERVISOR:
        return 'Руководитель закупок';
      case UserRoleValues.EXECUTIVE:
        return 'ТОП-менеджмент';
      default:
        return '';
    }
  };

  const availableRoles = getAvailableRoles();

  // Валидация email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Проверка необходимости указания департамента
  const needsDepartment = role === UserRoleValues.MANAGER || role === UserRoleValues.SUPERVISOR;

  useEffect(() => {
    if (!open) {
      return;
    }

    const loadDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        let companyId = authStore.user?.companyId;
        if (!companyId) {
          const company = await CompanyApi.getCompany();
          companyId = company.id;
        }

        if (!companyId) {
          setDepartments([]);
          return;
        }

        const list = await DepartmentApi.getDepartmentsByCompanyId(companyId);
        setDepartments(list);
      } catch (loadError) {
        console.error('Failed to load departments for invite form:', loadError);
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    void loadDepartments();
  }, [open, authStore.user?.companyId]);

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Валидация
    if (!email) {
      setError('Введите email адрес');
      return;
    }

    if (!validateEmail(email)) {
      setError('Некорректный email адрес');
      return;
    }

    if (needsDepartment && !departmentId) {
      setError('Выберите департамент');
      return;
    }

    setLoading(true);

    try {
      await onInvite(email, role, needsDepartment ? departmentId : undefined);
      setSuccess(`Приглашение отправлено на ${email}`);

      // Очистка формы через 2 секунды
      setTimeout(() => {
        setEmail('');
        setRole(UserRoleValues.MANAGER);
        setDepartmentId('');
        setSuccess('');
        onClose();
      }, 2000);
    } catch (err: any) {
      const serverStatus = err?.response?.status;
      const serverError = err?.response?.data?.error;
      const serverMessage = err?.response?.data?.message;

      if (
        serverStatus === 400 &&
        (serverError === 'User with this email does not exist' ||
          serverMessage === 'User with this email does not exist')
      ) {
        setError('Не удалось найти сотрудника с таким email');
      } else {
        setError(serverMessage || err.message || 'Ошибка при отправке приглашения');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setRole(UserRoleValues.MANAGER);
      setDepartmentId('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAddOutlined color="primary" />
          <Typography variant="h6">Пригласить сотрудника</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Сообщения */}
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">
              {success}
            </Alert>
          )}

          {/* Email */}
          <TextField
            label="Email сотрудника"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@company.com"
            fullWidth
            required
            disabled={loading}
            helperText="На этот адрес будет отправлено приглашение"
          />

          {/* Роль */}
          <FormControl fullWidth required disabled={loading}>
            <InputLabel>Роль</InputLabel>
            <Select
              value={role}
              label="Роль"
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              {availableRoles.map((roleOption) => (
                <MenuItem key={roleOption} value={roleOption}>
                  {getRoleLabel(roleOption)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Департамент (условно) */}
          {needsDepartment && (
            <FormControl fullWidth required disabled={loading || departmentsLoading}>
              <InputLabel>Департамент</InputLabel>
              <Select
                value={departmentId}
                label="Департамент"
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                {departments.map((department) => (
                  <MenuItem key={department.id} value={department.id}>
                    {department.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Информация */}
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              После отправки приглашения пользователь автоматически становится
              сотрудником вашей компании.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !!success}
          startIcon={loading ? <CircularProgress size={20} /> : <PersonAddOutlined />}
        >
          {loading ? 'Отправка...' : 'Отправить приглашение'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});