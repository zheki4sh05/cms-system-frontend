
import { useEffect, type FC } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Divider
} from '@mui/material';
import { LoginForm } from '@features/auth/ui/LoginForm';
import { useAuthStore } from '@features/auth/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { UserRoleValues } from '@shared/types/customTypes';

export const LoginPage: FC = observer(() => {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  // Если пользователь уже авторизован, редиректим на стартовую страницу роли
  useEffect(() => {
    if (authStore.isAuthenticated && authStore.userRole) {
      switch (authStore.userRole) {
        case UserRoleValues.MANAGER:
          navigate('/manager/incidents', { replace: true });
          break;
        case UserRoleValues.SUPERVISOR:
          navigate('/supervisor/dashboard', { replace: true });
          break;
        case UserRoleValues.EXECUTIVE:
          navigate('/executive/dashboard', { replace: true });
          break;
      }
    }
  }, [authStore.isAuthenticated, authStore.userRole, navigate]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <Typography 
          component="h1" 
          variant="h4" 
          gutterBottom 
          align="center"
          sx={{ fontWeight: 600, color: 'primary.main' }}
        >
          Система управления комплаенс-рисками
        </Typography>

        <Paper
          elevation={3}
          sx={{
            mt: 4,
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
          }}
        >
          <Typography 
            component="h2" 
            variant="h5" 
            sx={{ mb: 1, fontWeight: 500 }}
          >
            Вход в систему
          </Typography>

          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ mb: 3 }}
          >
            Введите ваши учетные данные для доступа
          </Typography>

          <Divider sx={{ width: '100%', mb: 3 }} />

          <LoginForm />
        </Paper>

        <Typography 
          variant="caption" 
          color="text.secondary" 
          align="center"
          sx={{ mt: 4 }}
        >
          © 2025 Compliance Risk Management System. Все права защищены.
        </Typography>
      </Box>
    </Container>
  );
});