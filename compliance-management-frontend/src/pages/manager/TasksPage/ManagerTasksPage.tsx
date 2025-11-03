
import { type FC } from 'react';
import { Container, Typography, Box } from '@mui/material';

export const ManagerTasksPage: FC = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Мои задачи
        </Typography>
        <Typography variant="body1">
          Здесь будет список задач менеджера
        </Typography>
      </Box>
    </Container>
  );
};