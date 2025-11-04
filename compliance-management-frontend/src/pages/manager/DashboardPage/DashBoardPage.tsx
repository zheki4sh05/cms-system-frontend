import type { FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const ManagerDashboardPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Главная панель менеджера
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будет отображаться главная панель с виджетами: новые инциденты, 
          активные случаи и задачи с приближающимся дедлайном.
        </Typography>
      </Paper>
    </Box>
  );
};
    