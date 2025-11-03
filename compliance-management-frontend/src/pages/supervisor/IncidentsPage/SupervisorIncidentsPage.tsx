
import { type FC } from 'react';
import { Container, Typography, Box } from '@mui/material';

export const SupervisorIncidentsPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Все инциденты отдела
        </Typography>
        <Typography variant="body1">
          Здесь будет список всех инцидентов для руководителя
        </Typography>
      </Box>
    </Container>
  );
};