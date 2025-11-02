
import { Container, Typography, Box } from '@mui/material';
import type { FC } from 'react';

export const SupervisorDashboardPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Панель руководителя закупок
        </Typography>
        <Typography variant="body1">
          Здесь будут отображаться KPI команды и очередь на верификацию
        </Typography>
      </Box>
    </Container>
  );
};
