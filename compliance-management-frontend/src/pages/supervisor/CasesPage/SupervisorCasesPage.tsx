import type { FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const SupervisorCasesPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Все случаи отдела
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будет список всех случаев отдела с возможностью фильтрации,
          переназначения и верификации.
        </Typography>
      </Paper>
    </Box>
  );
};