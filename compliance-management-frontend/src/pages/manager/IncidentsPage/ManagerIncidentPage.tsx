
import { type FC } from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ManagerIncidentsPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Инциденты
        </Typography>
        <Typography variant="body1">
          Здесь будет список инцидентов менеджера
        </Typography>
      </Box>
    </Container>
  );
};