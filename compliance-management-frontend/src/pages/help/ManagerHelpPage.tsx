import {type FC } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  CheckCircleOutline,
  PlayArrowOutlined,
} from '@mui/icons-material';

const firstSteps = [
  {
    label: 'Ознакомьтесь с интерфейсом',
    description: `Изучите основные разделы системы:
    • Главная панель - обзор текущих задач и статистика
    • Инциденты - список инцидентов для обработки
    • Случаи - ваши расследования
    • Мои задачи - задачи из планов корректирующих действий`,
  },
  {
    label: 'Настройте уведомления',
    description: `Перейдите в настройки профиля и настройте:
    • Email уведомления о новых инцидентах
    • Push-уведомления о критических событиях
    • Периодичность сводных отчетов`,
  },
  {
    label: 'Обработайте первый инцидент',
    description: `1. Перейдите в раздел "Инциденты"
    2. Выберите инцидент из списка
    3. Проанализируйте детали и подтвердите или отклоните
    4. Если подтверждаете - создайте случай для расследования`,
  },
  {
    label: 'Создайте план корректирующих действий',
    description: `При расследовании случая:
    1. Определите корневую причину проблемы
    2. Разработайте план действий для предотвращения повторения
    3. Назначьте ответственных и сроки
    4. Отправьте на верификацию руководителю`,
  },
];

export const ManagerHelpPage: FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Помощь и документация
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Добро пожаловать в систему TrustFlow! Здесь вы найдете всю необходимую информацию для работы.
        </Typography>

        {/* Первые шаги */}
        <Paper sx={{ p: 4, mb: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Добро пожаловать в TrustFlow!
            </Typography>
            <Typography variant="body2">
              Следуйте этим шагам, чтобы начать эффективную работу с системой.
            </Typography>
          </Alert>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Первые шаги
          </Typography>

          <Stepper orientation="vertical">
            {firstSteps.map((step, index) => (
              <Step key={index} active>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </Box>
                  )}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'pre-line', mb: 2 }}
                  >
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>

        {/* FAQ */}
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Часто задаваемые вопросы
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Что делать, если я получил ложный инцидент?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Отклоните инцидент в интерфейсе обработки, указав причину "Ложное срабатывание".
                Система учтет ваше решение для улучшения точности определения в будущем.
                При необходимости добавьте комментарий с дополнительной информацией.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Как создать план корректирующих действий?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                1. Откройте случай в расследовании
                <br />
                2. Нажмите "Создать план действий"
                <br />
                3. Добавьте задачи с указанием ответственных и сроков
                <br />
                4. Сохраните и отправьте на верификацию
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Куда обращаться за технической поддержкой?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Напишите на support@trustflow.com или используйте форму обратной связи
                в разделе "Настройки" → "Поддержка". Среднее время ответа - 2 часа в рабочее время.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Как изменить настройки уведомлений?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Перейдите в меню профиля (правый верхний угол) → "Настройки" → "Уведомления".
                Там вы можете настроить каналы и частоту получения уведомлений.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Container>
  );
};