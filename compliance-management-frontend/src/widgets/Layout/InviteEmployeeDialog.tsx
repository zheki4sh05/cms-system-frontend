import { type FC, useState } from 'react';
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
      setError('Укажите ID департамента');
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
      setError(err.message || 'Ошибка при отправке приглашения');
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
            <TextField
              label="ID департамента"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              placeholder="dept-001"
              fullWidth
              required
              disabled={loading}
              helperText="Укажите идентификатор департамента сотрудника"
            />
          )}

          {/* Информация */}
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              После отправки приглашения сотрудник получит email с ссылкой для
              регистрации в системе. Приглашение действительно 7 дней.
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