
import type { FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const ManagerIncidentsPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Инциденты
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будет список инцидентов, назначенных на менеджера.
          Можно будет фильтровать, сортировать и переходить к деталям.
        </Typography>
      </Paper>
    </Box>
  );
};