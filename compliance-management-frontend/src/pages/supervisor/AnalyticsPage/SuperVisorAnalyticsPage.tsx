import type { FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const SupervisorAnalyticsPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Аналитика
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будут дашборды с трендами, эффективностью правил и анализом рисков.
        </Typography>
      </Paper>
    </Box>
  );
};