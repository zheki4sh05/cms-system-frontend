import type { FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const ManagerCasesPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Случаи
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будет список случаев в работе.
          Можно создавать новые случаи, вести расследование и формировать планы действий.
        </Typography>
      </Paper>
    </Box>
  );
};