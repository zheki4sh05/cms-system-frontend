
import { type FC } from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ManagerCasesPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Случаи
        </Typography>
        <Typography variant="body1">
          Здесь будет список случаев менеджера
        </Typography>
      </Box>
    </Container>
  );
};