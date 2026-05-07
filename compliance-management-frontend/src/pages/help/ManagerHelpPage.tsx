import { type FC } from 'react';
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
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
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

const priorityMatrix = [
  {
    label: 'Критический инцидент',
    description:
      'Потенциальный ущерб компании, признаки мошенничества или репутационных потерь. Обрабатывайте в первую очередь, фиксируйте решения максимально подробно и при необходимости сразу эскалируйте руководителю.',
  },
  {
    label: 'Высокий приоритет',
    description:
      'Есть риск нарушения внутренних регламентов, но без немедленного критического эффекта. Проведите проверку в тот же рабочий день и создайте случай, если требуется расследование.',
  },
  {
    label: 'Средний/низкий приоритет',
    description:
      'Требуется уточнение контекста или дополнительная информация от смежных подразделений. Подтвердите статус, укажите план действий и контрольную дату в комментарии к инциденту.',
  },
];

const managerChecklist = [
  'Проверяйте полноту данных инцидента до принятия решения: источник, участники, приложенные материалы, временная шкала.',
  'Фиксируйте обоснование каждого решения (подтверждение/отклонение/эскалация) в комментарии к карточке.',
  'При создании случая формулируйте гипотезу корневой причины, чтобы ускорить дальнейшее расследование.',
  'Для плана корректирующих действий задавайте измеримые критерии выполнения (что и как будет проверено).',
  'Контролируйте сроки задач в разделе "Мои задачи" и заранее обновляйте статус, если есть риск просрочки.',
  'Перед отправкой на верификацию проверяйте, что у всех задач назначены ответственные и дедлайны.',
];

const incidentStatuses = [
  {
    code: 'OPEN',
    description: 'Инцидент создан и ожидает обработки.',
  },
  {
    code: 'PARTLY_PROGRESS',
    description:
      'Как минимум один связанный случай все еще находится на этапе назначения, при этом остальные уже могут быть в работе.',
  },
  {
    code: 'IN_PROGRESS',
    description: 'Связанные активные случаи находятся в процессе расследования/выполнения workflow.',
  },
  {
    code: 'RESOLVED',
    description: 'Инцидент урегулирован.',
  },
];

const incidentStatusTable = [
  {
    code: 'OPEN',
    whenUsed: 'После регистрации нового инцидента до начала предметной обработки.',
    actor: 'Система',
  },
  {
    code: 'PARTLY_PROGRESS',
    whenUsed: 'Когда по инциденту создано несколько случаев, и часть из них еще на назначении.',
    actor: 'Система',
  },
  {
    code: 'IN_PROGRESS',
    whenUsed: 'Когда связанные активные случаи переведены в рабочие этапы расследования.',
    actor: 'Система',
  },
  {
    code: 'RESOLVED',
    whenUsed: 'После завершения работ по инциденту и подтверждения урегулирования.',
    actor: 'Менеджер/система (по бизнес-процессу)',
  },
];

const caseStatuses = [
  {
    code: 'ASSIGNED',
    description: 'Случай назначен ответственному пользователю.',
  },
  {
    code: 'OPEN',
    description: 'Случай открыт.',
  },
  {
    code: 'INVESTIGATING',
    description: 'Расследование в процессе.',
  },
  {
    code: 'ACTION_PLAN',
    description: 'Этап формирования плана корректирующих действий.',
  },
  {
    code: 'WAITING_VERIFICATION',
    description: 'План действий отправлен и ожидает верификации.',
  },
  {
    code: 'ACTION_IN_PROGRESS',
    description: 'Верифицированный план действий выполняется.',
  },
  {
    code: 'REJECTED',
    description: 'Случай отклонен.',
  },
  {
    code: 'CLOSED',
    description: 'Случай завершен и закрыт.',
  },
];

const caseStatusTable = [
  {
    code: 'ASSIGNED',
    whenUsed: 'Случай назначен конкретному ответственному исполнителю.',
    actor: 'Руководитель/менеджер',
  },
  {
    code: 'OPEN',
    whenUsed: 'Случай открыт и готов к началу работы.',
    actor: 'Система/ответственный',
  },
  {
    code: 'INVESTIGATING',
    whenUsed: 'Исполнитель начал анализ материалов и проверку гипотез.',
    actor: 'Ответственный по случаю',
  },
  {
    code: 'ACTION_PLAN',
    whenUsed: 'Начата подготовка плана корректирующих действий по результатам расследования.',
    actor: 'Ответственный по случаю',
  },
  {
    code: 'WAITING_VERIFICATION',
    whenUsed: 'План действий отправлен на проверку и ожидает решения верификатора.',
    actor: 'Ответственный по случаю',
  },
  {
    code: 'ACTION_IN_PROGRESS',
    whenUsed: 'План прошел верификацию и задачи по нему выполняются.',
    actor: 'Система/исполнители задач',
  },
  {
    code: 'REJECTED',
    whenUsed: 'Случай или предложенное решение отклонены по итогам проверки.',
    actor: 'Верификатор/руководитель',
  },
  {
    code: 'CLOSED',
    whenUsed: 'Все работы завершены, результаты зафиксированы, случай закрыт.',
    actor: 'Ответственный/руководитель',
  },
];

const taskStatuses = [
  {
    code: 'TODO',
    description: 'Задача создана и ожидает начала выполнения.',
  },
  {
    code: 'IN_PROGRESS',
    description: 'Задача в работе.',
  },
  {
    code: 'DONE',
    description: 'Задача выполнена.',
  },
];

const taskStatusTable = [
  {
    code: 'TODO',
    whenUsed: 'Задача создана и включена в план, но исполнитель еще не приступил.',
    actor: 'Автор плана/система',
  },
  {
    code: 'IN_PROGRESS',
    whenUsed: 'Исполнитель начал выполнение задачи и ведет работу.',
    actor: 'Исполнитель задачи',
  },
  {
    code: 'DONE',
    whenUsed: 'Задача завершена, результат зафиксирован и готов к контролю.',
    actor: 'Исполнитель задачи',
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
          Добро пожаловать в TrustFlow. Ниже собраны практические рекомендации по обработке инцидентов,
          ведению расследований, работе с планами корректирующих действий и взаимодействию с руководителем.
        </Typography>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Добро пожаловать в TrustFlow!
            </Typography>
            <Typography variant="body2">
              Раздел поможет быстро пройти путь от первого инцидента до контроля исполнения
              корректирующих мер без потери сроков и качества.
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

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Как менеджеру расставлять приоритеты
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Используйте матрицу ниже при ежедневной обработке входящей очереди. Это снижает риск
            пропуска действительно значимых инцидентов и помогает стабильно соблюдать внутренние SLA.
          </Typography>

          <Stepper orientation="vertical">
            {priorityMatrix.map((item, index) => (
              <Step key={item.label} active>
                <StepLabel
                  StepIconComponent={() => (
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      {index + 1}
                    </Box>
                  )}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {item.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Paper sx={{ p: 4, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Чек-лист качества решения
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Пройдитесь по пунктам перед закрытием инцидента или отправкой плана на верификацию.
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {managerChecklist.map((item) => (
              <Box
                component="li"
                key={item}
                sx={{ mb: 1.5, color: 'text.secondary' }}
              >
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Ниже приведены статусы, которые используются в рабочих процессах менеджера. Единая трактовка
            статусов помогает быстрее принимать решения и корректно вести коммуникацию с командой.
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            Статусы инцидента
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, mb: 2.5 }}>
            {incidentStatuses.map((status) => (
              <Box component="li" key={status.code} sx={{ mb: 1, color: 'text.secondary' }}>
                <Typography variant="body2" color="inherit">
                  <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {status.code}
                  </Box>{' '}
                  - {status.description}
                </Typography>
              </Box>
            ))}
          </Box>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              При переводе инцидента в статус <Box component="span" sx={{ fontWeight: 600 }}>RESOLVED</Box>
              {' '}в поле <Box component="span" sx={{ fontWeight: 600 }}>incident.resolved_date</Box> автоматически
              записывается метка времени этого перехода.
            </Typography>
          </Alert>
          <TableContainer sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" aria-label="Таблица статусов инцидента">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Код статуса</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Когда ставится</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Кто обычно меняет</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incidentStatusTable.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{row.whenUsed}</TableCell>
                    <TableCell>{row.actor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            Статусы случая
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0, mb: 2.5 }}>
            {caseStatuses.map((status) => (
              <Box component="li" key={status.code} sx={{ mb: 1, color: 'text.secondary' }}>
                <Typography variant="body2" color="inherit">
                  <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {status.code}
                  </Box>{' '}
                  - {status.description}
                </Typography>
              </Box>
            ))}
          </Box>
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Статус <Box component="span" sx={{ fontWeight: 600 }}>IN_PROGRESS</Box> используется только для
              инцидента и не применяется к случаю.
            </Typography>
          </Alert>
          <TableContainer sx={{ mb: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" aria-label="Таблица статусов случая">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Код статуса</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Когда ставится</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Кто обычно меняет</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {caseStatusTable.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{row.whenUsed}</TableCell>
                    <TableCell>{row.actor}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
            Статусы задач плана действий
          </Typography>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {taskStatuses.map((status) => (
              <Box component="li" key={status.code} sx={{ mb: 1, color: 'text.secondary' }}>
                <Typography variant="body2" color="inherit">
                  <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {status.code}
                  </Box>{' '}
                  - {status.description}
                </Typography>
              </Box>
            ))}
          </Box>
          <TableContainer sx={{ mt: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" aria-label="Таблица статусов задач плана действий">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Код статуса</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Когда ставится</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Кто обычно меняет</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {taskStatusTable.map((row) => (
                  <TableRow key={row.code}>
                    <TableCell sx={{ fontWeight: 600 }}>{row.code}</TableCell>
                    <TableCell>{row.whenUsed}</TableCell>
                    <TableCell>{row.actor}</TableCell>
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
                Когда нужно эскалировать инцидент руководителю?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Эскалируйте инцидент, если выявлен высокий потенциальный ущерб, затронуты
                несколько подразделений, есть конфликт интересов или для решения требуется
                управленческое согласование. Перед эскалацией зафиксируйте факты, уже выполненные шаги
                и предложенный вариант дальнейших действий.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Как не допустить просрочки задач в плане действий?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Разбивайте крупные действия на подзадачи с промежуточными датами, ежедневно
                просматривайте раздел "Мои задачи" и обновляйте статусы при появлении рисков.
                Если дедлайн может быть нарушен, заранее согласуйте корректировку сроков с обоснованием.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Какие метрики важно отслеживать менеджеру каждую неделю?
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                Ключевые показатели: доля подтвержденных инцидентов, среднее время реакции,
                процент планов, отправленных на доработку, доля просроченных задач и количество
                повторных инцидентов по одной причине. Эти метрики помогают выявлять узкие места
                в процессе и приоритизировать улучшения.
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