import { type FC, useState, type FormEvent } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  MenuItem,
  Stack,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAddAlt1Outlined } from '@mui/icons-material';
import { useAuthStore } from '../useAuthStore';
import { useNavigate } from 'react-router-dom';
import { UserRoleValues } from '@shared/types/customTypes';

export const RegisterForm: FC = observer(() => {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: UserRoleValues.MANAGER,
    departmentId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as string]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password || !form.firstName || !form.lastName || !confirm) {
      setError('Пожалуйста, заполните все поля.');
      return;
    }
    if (form.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов.');
      return;
    }
    if (form.password !== confirm) {
      setError('Пароли не совпадают.');
      return;
    }
    try {
      await authStore.register(form);
      // После регистрации MobX и RouterProvider переведут на страницу помощи
    } catch (e) {
      setError(authStore.error || 'Ошибка регистрации');
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ mt: 2, maxWidth: 400, mx: 'auto' }}
    >
      <Typography variant="h5" align="center" sx={{ mb: 2 }}>
        Регистрация
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label="Имя"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Фамилия"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          fullWidth
          required
        />
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          fullWidth
          type="email"
          required
        />
        <FormControl fullWidth required>
          <InputLabel>Роль</InputLabel>
          <Select
            label="Роль"
            name="role"
            value={form.role}
            onChange={(e) =>handleChange(e as React.ChangeEvent<{ name?: string; value: unknown }>)
  }
          >
            <MenuItem value={UserRoleValues.MANAGER}>Менеджер по закупкам</MenuItem>
            <MenuItem value={UserRoleValues.SUPERVISOR}>Руководитель закупок</MenuItem>
            <MenuItem value={UserRoleValues.EXECUTIVE}>ТОП-менеджмент</MenuItem>
          </Select>
        </FormControl>
        {(form.role === UserRoleValues.MANAGER || form.role === UserRoleValues.SUPERVISOR) && (
          <TextField
            label="ID отдела"
            name="departmentId"
            value={form.departmentId}
            onChange={handleChange}
            fullWidth
            required
          />
        )}
        <TextField
          label="Пароль"
          name="password"
          value={form.password}
          onChange={handleChange}
          fullWidth
          required
          type={showPassword ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(s => !s)}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <TextField
          label="Подтвердите пароль"
          name="confirm"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          fullWidth
          required
          type={showPassword ? 'text' : 'password'}
        />
        <Button
          type="submit"
          variant="contained"
          size="large"
          startIcon={authStore.isLoading ? <CircularProgress size={20} color="inherit" /> : <PersonAddAlt1Outlined />}
          disabled={authStore.isLoading}
          sx={{ mt: 2, mb: 1 }}
          fullWidth
        >
          Зарегистрироваться
        </Button>
        <Button
          variant="text"
          size="medium"
          color="primary"
          onClick={() => navigate('/login')}
        >
          Уже есть аккаунт? Войти
        </Button>
      </Stack>
    </Box>
  );
});