
import { type FC,useEffect } from 'react';
import { Container, Box, Paper } from '@mui/material';
import { RegisterForm } from '@features/auth/ui/RegisterForm';
import { useAuthStore } from '@features/auth/useAuthStore';
import { UserRoleValues } from '@shared/types/customTypes';
import { useNavigate } from 'react-router-dom';

export const RegisterPage: FC = () => {
     const authStore = useAuthStore();
     const navigate = useNavigate();

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
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper sx={{ p: 4, width: '100%' }} elevation={3}>
          <RegisterForm />
        </Paper>
      </Box>
    </Container>
  );
};