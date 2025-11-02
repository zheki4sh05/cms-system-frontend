
import { Box, Container, Typography } from '@mui/material';
import type { FC } from 'react';

export const LoginPage: FC = () => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4">
          Система управления комплаенс-рисками
        </Typography>
        <Typography component="h2" variant="h5" sx={{ mt: 2 }}>
          Вход в систему
        </Typography>
        {/* Login form will be added later */}
      </Box>
    </Container>
  );
};
