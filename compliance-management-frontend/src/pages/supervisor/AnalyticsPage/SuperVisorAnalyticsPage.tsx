
import { type FC } from 'react';
import { Container, Typography, Box } from '@mui/material';

export const SupervisorAnalyticsPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Аналитика
        </Typography>
        <Typography variant="body1">
          Здесь будет аналитический дашборд для руководителя
        </Typography>
      </Box>
    </Container>
  );
};