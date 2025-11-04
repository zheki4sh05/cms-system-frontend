
import { type FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const ExecutiveReportsPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Отчеты
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будет генерация сводных отчетов для совета директоров
          и стратегических совещаний.
        </Typography>
      </Paper>
    </Box>
  );
};