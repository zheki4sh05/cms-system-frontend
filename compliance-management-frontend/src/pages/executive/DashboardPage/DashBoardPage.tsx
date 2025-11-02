import type { FC } from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ExecutiveDashboardPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Стратегическая панель ТОП-менеджмента
        </Typography>
        <Typography variant="body1">
          Здесь будут отображаться стратегические KPI и аналитика
        </Typography>
      </Box>
    </Container>
  );
};
