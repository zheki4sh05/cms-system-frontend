import { type FC } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const firstSteps = [
  {
    label: 'Изучите панель управления',
    description: `Ознакомьтесь с основными разделами:
    • KPI команды - показатели эффективности
    • Очередь на верификацию - планы для проверки
    • Аналитика - тренды и проблемные зоны`,
  },
  {
    label: 'Настройте правила комплаенс-контроля',
    description: `В разделе "Правила":
    • Проверьте активные правила
    • При необходимости настройте пороговые значения
    • Активируйте/деактивируйте правила под вашу специфику`,
  },
  {
    label: 'Проверьте первый план действий',
    description: `1. Откройте очередь на верификацию
    2. Выберите план для проверки
    3. Проанализируйте предложенные действия
    4. Утвердите или отправьте на доработку`,
  },
];

export const SupervisorHelpPage: FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Помощь для руководителя
        </Typography>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Руководство по работе с системой для руководителей отдела закупок
            </Typography>
          </Alert>

          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Первые шаги
          </Typography>

          <Stepper orientation="vertical">
            {firstSteps.map((step, index) => (
              <Step key={index} active>
                <StepLabel>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {step.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Часто задаваемые вопросы
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Как распределить нагрузку между менеджерами?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                В разделе "Инциденты" вы можете вручную переназначить инциденты другим менеджерам.
                Система также показывает текущую нагрузку каждого сотрудника.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Как создать отчет для топ-менеджмента?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Раздел "Аналитика" → "Экспорт отчета". Выберите период и метрики для включения в отчет.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Container>
  );
};