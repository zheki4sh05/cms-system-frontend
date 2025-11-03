import { type FC } from 'react';
import { Container, Typography, Box } from '@mui/material';

export const SupervisorCasesPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Все случаи отдела
        </Typography>
        <Typography variant="body1">
          Здесь будет список всех случаев для руководителя
        </Typography>
      </Box>
    </Container>
  );
};