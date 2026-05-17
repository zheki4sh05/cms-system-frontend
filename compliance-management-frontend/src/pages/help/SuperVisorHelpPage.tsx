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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Dashboard as DashboardIcon,
  ReportProblem as ReportProblemIcon,
  Rule as RuleIcon,
  HelpOutline as HelpIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
  Insights as InsightsIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

const firstSteps = [
  {
    label: 'Откройте «Главную панель»',
    description: `Это основной экран руководителя отдела: KPI команды, очередь верификации планов действий, проблемные зоны, обзор инцидентов и эффективность правил.
    Данные загружаются при открытии страницы. Кнопка «Обновить» перезапрашивает все блоки; «Скачать PDF» формирует отчёт по текущему снимку панели.`,
  },
  {
    label: 'Разберите очередь верификации',
    description: `В блоке «Очередь верификации» отображаются планы действий, ожидающие вашего решения.
    1. Выберите запись в списке
    2. Ознакомьтесь с контекстом (инцидент, документ, ответственный)
    3. Утвердите план или отправьте на доработку с комментарием`,
  },
  {
    label: 'Используйте «Инциденты и случаи» для детального разбора',
    description: `Раздел даёт постраничный отчёт по инцидентам с обнаружениями, кейсами, комментариями, вложениями и задачами плана.
    Фильтры: ID инцидента, ID документа интеграции, статус workflow. Карточку можно раскрыть или открыть в диалоге для работы с планом действий.`,
  },
  {
    label: 'Проверьте реестр правил',
    description: `В разделе «Правила» — единый список правил комплаенс-контроля компании.
    Колонка «Серьёзность» отражает вес правила в очереди (число или код) с подписью на русском языке. Откройте правило, чтобы увидеть условие, действие и связанный объект риска.`,
  },
];

const supervisorChecklist = [
  'Ежедневно просматривайте очередь верификации и фиксируйте решения с обоснованием в комментарии.',
  'Сверяйте KPI менеджеров с фактической нагрузкой: просроченные планы и кейсы в статусе ожидания верификации.',
  'Анализируйте «Проблемные зоны» за актуальный месяц — повторные срабатывания по одному документу интеграции.',
  'При утверждении плана проверяйте измеримость задач, сроки и назначенных исполнителей в разделе «Инциденты и случаи».',
  'Контролируйте активные правила: отключайте устаревшие и следите за эффективностью (отклонённые / закрытые кейсы по ruleId).',
  'При расхождении цифр на панели и в отчёте уточняйте охват данных (отдел / компания) во всплывающих подсказках и у администратора API.',
];

const incidentWorkflowStatuses = [
  { code: 'OPEN', label: 'Открыт', description: 'Инцидент зарегистрирован, предметная обработка ещё не начата.' },
  {
    code: 'PARTLY_PROGRESS',
    label: 'Частично в работе',
    description: 'Часть связанных кейсов уже в работе, другие ещё на этапе назначения.',
  },
  { code: 'IN_PROGRESS', label: 'В работе', description: 'Связанные активные кейсы находятся в расследовании или исполнении.' },
  { code: 'RESOLVED', label: 'Решён', description: 'Работы по инциденту завершены.' },
];

const caseStatuses = [
  { code: 'WAITING_VERIFICATION', label: 'Ожидает верификации', description: 'План действий отправлен руководителю на проверку.' },
  { code: 'ACTION_IN_PROGRESS', label: 'План в исполнении', description: 'План утверждён, задачи выполняются.' },
  { code: 'CLOSED', label: 'Закрыт', description: 'Кейс завершён.' },
  { code: 'REJECTED', label: 'Отклонён', description: 'Кейс или решение отклонены по итогам проверки.' },
];

const severityWeightRu = [
  { source: 'LOW / 1–3', display: 'Низкий' },
  { source: 'MEDIUM / 4–6', display: 'Средний' },
  { source: 'HIGH / 7–8', display: 'Высокий' },
  { source: 'CRITICAL / 9–10', display: 'Критичный' },
];

export const SupervisorHelpPage: FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Помощь для руководителя
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Руководство по работе с TrustFlow для роли <strong>руководителя отдела (SUPERVISOR)</strong>: контроль
          команды, верификация планов корректирующих действий, мониторинг инцидентов и правил риска.
        </Typography>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Охват данных для SUPERVISOR обычно соответствует <strong>подчинённому отделу</strong> (поле scope в
              обзоре инцидентов — DEPARTMENT), в отличие от топ-менеджера с охватом компании. Точные фильтры
              задаются на бэкенде по правам вашей учётной записи.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Если блок панели не загрузился, обновите страницу кнопкой «Обновить» в шапке главной панели.
            </Typography>
          </Alert>

          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Разделы меню
          </Typography>
          <List dense>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <DashboardIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Главная панель"
                secondary="Путь: /supervisor/dashboard. KPI команды, очередь верификации, проблемные зоны, обзор инцидентов, эффективность правил, экспорт PDF."
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <ReportProblemIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Инциденты и случаи"
                secondary="Путь: /supervisor/incidents-cases. Отчёт по инцидентам с обнаружениями, кейсами, комментариями, вложениями и верификацией планов."
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <RuleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary="Правила"
                secondary="Путь: /supervisor/rules. Реестр правил компании: категория, серьёзность (вес), статус, объект риска."
              />
            </ListItem>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <HelpIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary="Помощь" secondary="Путь: /supervisor/help. Текущее руководство." />
            </ListItem>
          </List>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Первые шаги
          </Typography>
          <Stepper orientation="vertical">
            {firstSteps.map((step, index) => (
              <Step key={step.label} active>
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
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
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
              Главная панель — блоки данных
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Краткое описание блоков главной панели. Подробности расчёта показателей — во всплывающих подсказках на
            самой панели.
          </Typography>

          <List>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <AssessmentIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 600 }}
                primary="Сводные показатели"
                secondary="Ключевые метрики отдела: инциденты, кейсы, просрочки, тренды — для быстрой оценки ситуации в команде."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <PeopleIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 600 }}
                primary="KPI команды"
                secondary="По каждому менеджеру: назначенные и решённые инциденты, активные и закрытые кейсы, среднее время решения, доля задач планов, завершённых в срок."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <CheckCircleIcon color="success" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 600 }}
                primary="Очередь верификации"
                secondary="Планы действий без подтверждённой верификации. Из списка можно открыть диалог и утвердить план или отклонить его с комментарием."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <WarningIcon color="warning" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 600 }}
                primary="Проблемные зоны"
                secondary="Группы по documentId за календарный месяц (UTC): в отчёт попадают документы с двумя и более инцидентами за месяц. Карточку группы можно раскрыть для просмотра связанных инцидентов."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <InsightsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 600 }}
                primary="Обзор инцидентов"
                secondary="Охват (отдел / компания), конвейер статусов, привязка к документу, «зависшие» без решения, обнаружения без ответственного, стадии кейсов, планы с просроченными задачами, горячие объекты риска."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <ShieldIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 600 }}
                primary="Эффективность правил"
                secondary="По каждому правилу: имя, категория, число отклонённых и закрытых кейсов, признак активности правила."
              />
            </ListItem>
            <Divider component="li" variant="inset" />
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <DownloadIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontWeight: 600 }}
                primary="Экспорт PDF"
                secondary="Кнопка в шапке панели формирует PDF-отчёт по загруженным блокам (KPI, очередь, проблемные зоны, обзор, правила) для совещаний и архива."
              />
            </ListItem>
          </List>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <DescriptionIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Инциденты и случаи
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Список строится из <Chip size="small" label="GET /api/incidents/reports" variant="outlined" sx={{ mx: 0.5 }} />
            с пагинацией и фильтрами. Сводные счётчики в шапке — из{' '}
            <Chip size="small" label="GET /api/incidents/my/stats" variant="outlined" sx={{ mx: 0.5 }} />.
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, color: 'text.secondary' }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              Поиск по ID инцидента и ID документа интеграции; фильтр по статусу workflow (OPEN, PARTLY_PROGRESS,
              IN_PROGRESS, RESOLVED).
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              В списке кейсов отображается ответственный: имя подгружается из{' '}
              <Chip size="small" label="GET /api/users/{id}/basic-info" variant="outlined" sx={{ verticalAlign: 'middle' }} />{' '}
              по полю assignedUserId кейса.
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              В диалоге инцидента доступны комментарии и вложения к кейсу, прогресс задач плана, кнопки «Подтвердить
              план» и «На доработку» (с обязательным комментарием).
            </Typography>
          </Box>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <RuleIcon color="primary" />
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Правила
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Реестр загружается через <Chip size="small" label="GET /rules" variant="outlined" sx={{ mx: 0.5 }} /> в
            рамках компании. Отдельной колонки «Вес» нет: числовой или кодовый вес правила (priority) показывается в
            колонке «Серьёзность» с русской подписью.
          </Typography>
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" aria-label="Маппинг веса правила">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Значение priority / вес</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Подпись в интерфейсе</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {severityWeightRu.map((row) => (
                  <TableRow key={row.source}>
                    <TableCell>{row.source}</TableCell>
                    <TableCell>{row.display}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Чек-лист руководителя
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {supervisorChecklist.map((item) => (
              <Box component="li" key={item} sx={{ mb: 1.5, color: 'text.secondary' }}>
                <Typography variant="body2" color="inherit">
                  {item}
                </Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Статусы в системе
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            Статусы инцидента (workflow)
          </Typography>
          <TableContainer sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Код</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Подпись</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Смысл</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidentWorkflowStatuses.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            Ключевые статусы кейса
          </Typography>
          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Код</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Подпись</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Смысл</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {caseStatuses.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{row.label}</TableCell>
                    <TableCell>{row.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Часто задаваемые вопросы
          </Typography>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Где верифицировать план действий — на панели или в «Инцидентах и случаях»?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Оба варианта допустимы. На главной панели — быстрый проход по очереди pending-верификации. В разделе
                «Инциденты и случаи» — полный контекст: обнаружения, материалы расследования, задачи и вложения перед
                нажатием «Подтвердить план» или «На доработку». Для спорных случаев используйте детальный отчёт.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Как распределить нагрузку между менеджерами?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Ориентируйтесь на блок KPI команды на главной панели: число активных кейсов, просроченные планы и
                среднее время решения. Переназначение инцидентов и эскалация выполняются в рабочих процессах
                менеджеров; при системных перегрузках согласуйте регламент с топ-менеджментом.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Как подготовить отчёт для руководства компании?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                На главной панели нажмите «Скачать PDF» — в файл попадут текущие KPI, очередь верификации, проблемные
                зоны, обзор инцидентов и эффективность правил. Для детализации по конкретным инцидентам используйте
                экспорт данных из раздела «Инциденты и случаи» (скриншоты или выгрузки по регламенту IT).
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Почему в «Проблемных зонах» пусто?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                В отчёт попадают только documentId с не менее чем двумя инцидентами за выбранный месяц (UTC) и с
                привязкой к документу интеграции. Если повторных срабатываний по одному документу не было, список
                групп будет пустым — это ожидаемое поведение отбора.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Почему у кейса в отчёте «Не назначен» ответственный?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Ответственный берётся из поля assignedUserId кейса. Если бэкенд отдал только идентификатор без ФИО,
                интерфейс запрашивает профиль через GET /api/users/&#123;id&#125;/basic-info. Проверьте, что у кейса
                заполнен assignedUserId и сервис пользователей доступен.
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
                Напишите на support@trustflow.com или используйте форму в «Настройки» → «Поддержка». Среднее время
                ответа — до 2 часов в рабочее время.
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Paper>
      </Box>
    </Container>
  );
};
