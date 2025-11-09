import { type FC, useState, type FormEvent } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Stack,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LoginOutlined,
  PersonAddOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '../useAuthStore';
import { useNavigate } from 'react-router-dom';

export const LoginForm: FC = observer(() => {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  // Валидация email
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Валидация пароля
  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Обработка изменения email
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (value && !validateEmail(value)) {
      setErrors(prev => ({ ...prev, email: 'Некорректный email адрес' }));
    } else {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  // Обработка изменения пароля
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);

    if (value && !validatePassword(value)) {
      setErrors(prev => ({ ...prev, password: 'Пароль должен быть не менее 6 символов' }));
    } else {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Обработка отправки формы
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Валидация перед отправкой
    if (!email || !password) {
      if (!email) setErrors(prev => ({ ...prev, email: 'Введите email' }));
      if (!password) setErrors(prev => ({ ...prev, password: 'Введите пароль' }));
      return;
    }

    if (!validateEmail(email)) {
      setErrors(prev => ({ ...prev, email: 'Некорректный email адрес' }));
      return;
    }

    if (!validatePassword(password)) {
      setErrors(prev => ({ ...prev, password: 'Пароль должен быть не менее 6 символов' }));
      return;
    }

    try {
      await authStore.login({ email, password });
      // Навигация происходит автоматически через ProtectedRoute
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  // Переход на страницу регистрации
  const handleGoToRegister = () => {
    navigate('/register');
  };

  const hasErrors = errors.email || errors.password;
  const isFormValid = email && password && !hasErrors;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
      }}
    >
      {/* Общая ошибка от сервера */}
      {authStore.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {authStore.error}
        </Alert>
      )}

      <Stack spacing={2.5}>
        {/* Email поле */}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          error={Boolean(errors.email)}
          helperText={errors.email}
          fullWidth
          required
          autoComplete="email"
          autoFocus
        />

        {/* Пароль поле */}
        <TextField
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={handlePasswordChange}
          error={Boolean(errors.password)}
          helperText={errors.password}
          fullWidth
          required
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        {/* Кнопка входа */}
        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          disabled={!isFormValid || authStore.isLoading}
          startIcon={authStore.isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginOutlined />}
          sx={{
            mt: 1,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          {authStore.isLoading ? 'Вход...' : 'Войти'}
        </Button>

        {/* Разделитель */}
        <Divider sx={{ my: 2 }}>или</Divider>

        {/* Кнопка регистрации */}
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={handleGoToRegister}
          startIcon={<PersonAddOutlined />}
          sx={{
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          }}
        >
          Создать аккаунт
        </Button>
      </Stack>

      {/* Демо-доступы */}
      <Box sx={{ mt: 4, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
          Демо-доступы для тестирования:
        </Typography>
        <Typography variant="caption" component="div" color="text.secondary">
          • Менеджер: manager@example.com / password123
        </Typography>
        <Typography variant="caption" component="div" color="text.secondary">
          • Руководитель: supervisor@example.com / password123
        </Typography>
        <Typography variant="caption" component="div" color="text.secondary">
          • Топ-менеджмент: executive@example.com / password123
        </Typography>
      </Box>
    </Box>
  );
});