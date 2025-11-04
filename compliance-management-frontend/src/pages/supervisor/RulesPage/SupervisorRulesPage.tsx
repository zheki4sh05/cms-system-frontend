
import type { FC } from 'react';
import { Typography, Box, Paper } from '@mui/material';

export const SupervisorRulesPage: FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Администрирование правил
      </Typography>
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" color="text.secondary">
          Здесь будет управление правилами комплаенс-контроля:
          активация, деактивация и редактирование.
        </Typography>
      </Paper>
    </Box>
  );
};