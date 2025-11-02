
import { Container, Typography, Box } from '@mui/material';
import type { FC } from 'react';

export const ManagerDashboardPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>  
        <Typography variant="h4" gutterBottom>
          Панель менеджера по закупкам
        </Typography>
        <Typography variant="body1">
          Здесь будут отображаться инциденты, случаи и задачи
        </Typography>
      </Box>
    </Container>
  );
};
    