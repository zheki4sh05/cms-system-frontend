import { type FC } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Description as DescriptionIcon,
  Rule as RuleIcon,
  Dashboard as DashboardIcon,
  Insights as InsightsIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
  InfoOutlined,
} from '@mui/icons-material';

const firstSteps = [
  {
    label: 'Откройте «Стратегическую панель»',
    description: `Это главный экран для роли топ-менеджера: агрегаты по компании, обзор инцидентов, проблемные зоны, очередь верификации планов, эффективность правил и KPI менеджеров.
    Данные подгружаются с сервера при открытии страницы. Кнопка «Обновить» в правом верхнем углу перезапрашивает все блоки.`,
  },
  {
    label: 'Пользуйтесь подсказками на панели',
    description: `У многих показателей и заголовков таблиц есть всплывающие подсказки (наведите курсор или долгое касание на планшете): в них кратко поясняется смысл полей ответа API и правила расчёта, где это важно для интерпретации цифр.`,
  },
  {
    label: 'Перейдите к деталям при необходимости',
    description: `Раздел «Инциденты и случаи» — список отчётов по инцидентам с раскрытием обнаружений, кейсов и планов действий.
    «Правила» — просмотр правил риска в рамках вашей компании.`,
  },
];

export const ExecutiveHelpPage: FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Руководство для топ-менеджмента
        </Typography>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Роль <strong>топ-менеджера (EXECUTIVE)</strong> в CMS ориентирована на{' '}
              <strong>обзор по всей организации</strong>: те же инцидентные API, что и у других ролей, но выборка и
              охват обычно соответствуют <strong>компании</strong>, а не личным назначениям. Большинство экранов
              носит мониторинговый характер: вы видите картину, чтобы принимать решения вне системы или
              эскалировать работу руководителям отделов.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Если блок не загрузился, вверху страницы появится сообщение об ошибке; после устранения сбоя на
              стороне API или сети нажмите «Обновить данные».
            </Typography>
          </Alert>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Разделы меню
          </Typography>
          <List dense>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <BusinessIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Стратегическая панель"
                secondary="Путь: /executive/dashboard. Сводные метрики и таблицы по инцидентам, кейсам и планам (см. ниже)."
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <DescriptionIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Инциденты и случаи"
                secondary="Путь: /executive/incidents-cases. Постраничный список отчётов по инцидентам с полным контекстом обнаружений и кейсов."
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <RuleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Правила"
                secondary="Путь: /executive/rules. Правила комплаенс-контроля и риска, доступные вашей компании в системе."
              />
            </ListItem>
          </List>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
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

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DashboardIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Стратегическая панель — блоки данных
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ниже — соответствие экрана типичным эндпоинтам бэкенда. Точный состав полей зависит от версии API; смысл
            показателей дублируется во всплывающих подсказках на самой панели.
          </Typography>

          <List>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <InfoOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="subtitle1" fontWeight={600}>
                      Инциденты компании
                    </Typography>
                    <Chip size="small" label="GET /api/incidents/my/stats" variant="outlined" />
                  </Box>
                }
                secondary="Сводка по компании: число инцидентов и обнаружений, кейсы, статусы, важность, категории риска, среднее время закрытия, просроченные планы, планы без верификации и др. Для EXECUTIVE обычно полный охват компании."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <InsightsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="subtitle1" fontWeight={600}>
                      Обзор инцидентов
                    </Typography>
                    <Chip size="small" label="GET /api/incidents/overview" variant="outlined" />
                  </Box>
                }
                secondary="Поле scope (часто COMPANY), конвейер статусов инцидентов, привязка к документу интеграции, «зависшие» без решения, обнаружения без ответственного, стадии кейсов, планы с просроченными задачами, до пяти «горячих» объектов риска, распределение по важности объекта риска в мониторинге."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="subtitle1" fontWeight={600}>
                      Проблемные зоны
                    </Typography>
                    <Chip size="small" label="GET /api/incidents/problem-areas" variant="outlined" />
                  </Box>
                }
                secondary="Группы по documentId интеграции за выбранный календарный месяц (UTC, формат YYYY-MM): в группу попадают только документы, по которым в этом месяце не меньше двух разных инцидентов. Можно задать месяц в поле и нажать «Загрузить за месяц»; общая кнопка обновления в шапке подтягивает тот же месяц. Карточка открывает краткий список инцидентов из ответа (тот же состав, что у отчёта по инциденту)."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <AssessmentIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="subtitle1" fontWeight={600}>
                      Очередь верификации планов
                    </Typography>
                    <Chip size="small" label="GET /api/supervisor/verification/pending" variant="outlined" />
                  </Box>
                }
                secondary="Планы действий, ожидающие верификации: идентификаторы плана и инцидента, название связанного документа, ответственный, дата поступления инцидента. На стратегической панели список только для просмотра; утверждение и отклонение верификации выполняются в рабочих процессах руководителя отдела."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <ShieldIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="subtitle1" fontWeight={600}>
                      Эффективность правил
                    </Typography>
                    <Chip size="small" label="GET /api/incidents/rule-effectiveness" variant="outlined" />
                  </Box>
                }
                secondary="По каждому ruleId: имя правила, категория риска, число кейсов в статусах REJECTED и CLOSED, признак активности правила в Risk. Помогает увидеть, какие правила дают наибольший поток отклонений или закрытий в выборке."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <PeopleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography component="span" variant="subtitle1" fontWeight={600}>
                      KPI менеджеров
                    </Typography>
                    <Chip size="small" label="GET /api/incidents/kpi/managers" variant="outlined" />
                  </Box>
                }
                secondary="Таблица по менеджерам: назначенные и решённые инциденты, активные и закрытые кейсы, среднее время решения, доля задач планов, завершённых в срок. Для EXECUTIVE набор строк обычно формируется по компании, а не только по подчинённым одного отдела."
              />
            </ListItem>
          </List>

          <Alert severity="warning" sx={{ mt: 2 }} icon={<RefreshIcon />}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Обновление и месяц для «Проблемных зон»
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Смена месяца в поле YYYY-MM не запускает загрузку сама по себе: нажмите «Загрузить за месяц» или общую
              кнопку обновления в шапке страницы. Остальные блоки панели при этом тоже обновятся.
            </Typography>
          </Alert>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Часто задаваемые вопросы
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Почему в «Проблемных зонах» пусто, хотя инциденты есть?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" component="div">
                API включает в отчёт только инциденты с привязкой к документу интеграции, у которых по обнаружениям
                удаётся вычислить месяц (UTC) по дате обнаружения, и группирует их по documentId. Если за выбранный
                месяц у каждого documentId не больше одного инцидента, массив groups будет пустым — это ожидаемое
                поведение отбора «повторных срабатываний по одному документу».
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Чем обзор инцидентов отличается от блока «Инциденты компании»?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" component="div">
                «Инциденты компании» строится из сводной статистики (в т.ч. распределение по важности и категориям в
                одном ответе). «Обзор инцидентов» — отдельный агрегат с полем scope, конвейером статусов, связью с
                документом, кейсами, планами, точками риска и severity объекта риска. Оба блока дополняют друг друга;
                при расхождении цифр уточняйте у администратора, какие фильтры применены на бэкенде для вашей роли.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Могу ли я утвердить верификацию плана с панели топ-менеджера?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" component="div">
                На стратегической панели для роли EXECUTIVE очередь верификации выводится для мониторинга. Решения по
                верификации принимаются в процессах руководителя отдела (SUPERVISOR), где доступны соответствующие
                действия в интерфейсе. При необходимости измените регламент или права доступа через администратора
                системы.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Где посмотреть полный текст обнаружения и вложения по кейсу?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary" component="div">
                Откройте раздел «Инциденты и случаи», найдите нужный инцидент в списке отчётов и раскройте карточку:
                там отображаются обнаружения, кейсы, комментарии, вложения и планы действий в том виде, в каком их
                отдаёт API отчёта по инциденту.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Container>
  );
};
