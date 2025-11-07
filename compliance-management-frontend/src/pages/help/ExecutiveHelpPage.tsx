import {type FC } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { InfoOutlined } from '@mui/icons-material';

export const ExecutiveHelpPage: FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Руководство для топ-менеджмента
        </Typography>

        <Paper sx={{ p: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Стратегическая панель для мониторинга комплаенс-рисков на уровне компании
            </Typography>
          </Alert>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            Основные возможности
          </Typography>

          <List>
            <ListItem>
              <ListItemIcon>
                <InfoOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="KPI верхнего уровня"
                secondary="Мониторинг ключевых показателей комплаенс-контроля"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Тепловая карта рисков"
                secondary="Визуализация проблемных областей по отделам и категориям"
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <InfoOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Эскалированные случаи"
                secondary="Критические инциденты, требующие внимания руководства"
              />
            </ListItem>
          </List>
        </Paper>
      </Box>
    </Container>
  );
};