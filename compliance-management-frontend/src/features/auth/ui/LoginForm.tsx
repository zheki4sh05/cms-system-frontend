import { useState, type FC, type FormEvent } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  LoginOutlined 
} from '@mui/icons-material';
import { useAuthStore } from '@features/auth/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { UserRoleValues } from '@shared/types/customTypes';

export const LoginForm: FC = observer(() => {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Валидация email
  const validateEmail = (value: string): boolean => {
    if (!value) {
      setEmailError('Email обязателен для заполнения');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError('Некорректный формат email');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Валидация пароля
  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Пароль обязателен для заполнения');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Пароль должен содержать минимум 6 символов');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Очистка предыдущих ошибок
    authStore.clearError();

    // Валидация полей
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      const user = await authStore.login({ email, password });

      // Редирект в зависимости от роли пользователя
      switch (user.role) {
        case UserRoleValues.MANAGER:
          navigate('/manager/dashboard');
          break;
        case UserRoleValues.SUPERVISOR:
          navigate('/supervisor/dashboard');
          break;
        case UserRoleValues.EXECUTIVE:
          navigate('/executive/dashboard');
          break;
        default:
          navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const isFormValid = email && password && !emailError && !passwordError;

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        width: '100%',
        maxWidth: 400,
      }}
    >
      {authStore.error && (
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          onClose={() => authStore.clearError()}
        >
          {authStore.error}
        </Alert>
      )}

      <FormControl fullWidth margin="normal">
        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => handleEmailChange(e.target.value)}
          onBlur={() => validateEmail(email)}
          error={!!emailError}
          helperText={emailError}
          required
          autoComplete="email"
          autoFocus
          disabled={authStore.isLoading}
          placeholder="user@example.com"
        />
      </FormControl>

      <FormControl fullWidth margin="normal">
        <TextField
          fullWidth
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          onBlur={() => validatePassword(password)}
          error={!!passwordError}
          helperText={passwordError}
          required
          autoComplete="current-password"
          disabled={authStore.isLoading}
          placeholder="Введите пароль"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={authStore.isLoading}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </FormControl>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        size="large"
        disabled={authStore.isLoading || !isFormValid}
        startIcon={authStore.isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginOutlined />}
        sx={{ 
          mt: 3, 
          mb: 2,
          py: 1.5,
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        {authStore.isLoading ? 'Вход...' : 'Войти в систему'}
      </Button>
    </Box>
  );
});
