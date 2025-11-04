import type { FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const SupervisorDashboardPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Панель руководителя
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будет панель с KPI команды, очередью на верификацию и проблемными зонами.
        </Typography>
      </Paper>
    </Box>
  );
};
