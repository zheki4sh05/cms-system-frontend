import { CasePriority, CaseSeverity, CaseStatus, type Case, type CaseAttachment, type CaseComment, type CaseVerificationDetails, type CreateCaseRequest, type UpdateCaseRequest, type UpdateInvestigationRequest, type VerificationDecision } from "@shared/types/caseTypes";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
/** База для маршрутов вида /api/cases/... (без суффикса /api/v1), как в apiClient при url.startsWith('/api/'). */
const CASES_LEGACY_API_BASE = `${API_BASE_URL.replace(/\/api\/v1\/?$/, '')}/api`;
import { http, HttpResponse, delay } from 'msw';
// Добавить моковые данные для верификации
const mockVerificationDetails: Record<string, CaseVerificationDetails> = {
  'CS-2024-001': {
    caseId: 'CS-2024-001',
    actionPlanId: 'AP-2024-003',
    investigationSummary: 'Проведено детальное расследование случая превышения бюджета. Установлено, что поставщик ООО "Техноком" изменил цены на 23% после согласования бюджета закупки. Изменение произошло без уведомления отдела закупок. Проанализированы договорные документы, переписка с поставщиком и финансовые документы.',
    rootCauseAnalysis: 'Первопричина: отсутствие механизма контроля изменения цен после согласования бюджета. Существующие процедуры не предусматривают фиксацию цен в договорах и автоматический контроль их изменения. Менеджеры не имеют четких инструкций по действиям при одностороннем изменении условий поставщиком.',
    evidenceProvided: [
      'Договор поставки №123 от 15.11.2024',
      'Коммерческое предложение с первоначальными ценами',
      'Письмо поставщика об изменении цен от 28.11.2024',
      'Скриншоты из системы 1С с суммами превышения',
      'Протокол встречи с поставщиком',
    ],
    proposedActions: [
      {
        taskTitle: 'Пересмотреть регламент согласования бюджета',
        description: 'Добавить этап контроля изменения цен после согласования бюджета. Включить требование о фиксации цен в договорах.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-15T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Провести обучение для отдела закупок',
        description: 'Обучить сотрудников новым процедурам контроля изменения цен и действиям при одностороннем изменении условий.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-20T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Создать заявку в IT на доработку системы',
        description: 'Внедрить автоматическое уведомление при изменении цен поставщиком и блокировку транзакций до согласования.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-25T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Провести переговоры с поставщиком',
        description: 'Обсудить компенсацию превышения и внести изменения в договор о фиксации цен.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-10T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Подготовить отчет для руководства',
        description: 'Составить детальный отчет о случае и предложениях по предотвращению подобных ситуаций.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-08T23:59:59Z',
        status: 'DONE',
      },
    ],
    estimatedImpact: 'Финансовые потери составили 450 000 руб. При внедрении предложенных мер ожидается предотвращение подобных случаев, что может сэкономить до 2.5 млн руб/год. Также снизятся репутационные риски и улучшится контроль за бюджетом.',
    preventiveMeasures: 'Внедрение автоматизированного контроля цен, обязательная фиксация цен в договорах, обучение персонала, создание реестра одобренных поставщиков с зафиксированными условиями, квартальный аудит соблюдения процедур.',
    resourcesRequired: 'Бюджет на доработку IT-системы: ~150 000 руб, время на обучение персонала: 16 часов, юридическое сопровождение переговоров с поставщиком: 40 000 руб.',
    verificationStatus: 'PENDING',
  },
  'CS-2024-002': {
    caseId: 'CS-2024-002',
    investigationSummary: 'Выявлено дублирование записей поставщика ООО "Альфа" в базе данных. Обнаружено три записи с разными идентификаторами: VENDOR-234, VENDOR-345, VENDOR-456. Все записи относятся к одному ИНН 7707123456. Проблема возникла из-за ручного ввода данных разными сотрудниками в разное время.',
    rootCauseAnalysis: 'Первопричина: отсутствие автоматической проверки на дубликаты при создании новой записи контрагента. Сотрудники вводят данные вручную, используя разные варианты написания названия компании. Система не валидирует данные по ИНН перед созданием новой записи.',
    evidenceProvided: [
      'Выгрузка из базы данных с дубликатами',
      'Скриншоты записей VENDOR-234, VENDOR-345, VENDOR-456',
      'Выписка из ЕГРЮЛ для подтверждения единого ИНН',
    ],
    proposedActions: [],
    estimatedImpact: 'Низкое влияние. Ошибки в отчетности, затраты времени на исправление (~8 часов), риск ошибочных платежей (не реализовался).',
    preventiveMeasures: 'Внедрение автоматической проверки на дубликаты по ИНН, использование API ЕГРЮЛ для автозаполнения, централизация управления справочником контрагентов.',
    resourcesRequired: 'Минимальные. Настройка существующей системы, время разработчика: ~16 часов.',
    verificationStatus: 'PENDING',
  },
  'CS-2024-003': {
    caseId: 'CS-2024-003',
    actionPlanId: 'AP-2024-004',
    investigationSummary: 'Обнаружен критический случай конфликта интересов. Менеджер Сидоров А.И. проводил закупки у компании ООО "Техноком", где он является совладельцем (25% доли) согласно данным ЕГРЮЛ. За последние 6 месяцев было проведено 8 закупок на общую сумму 7.2 млн руб. Менеджер не раскрыл информацию о конфликте интересов.',
    rootCauseAnalysis: 'Первопричина: отсутствие процедуры декларирования конфликта интересов при найме и отсутствие автоматизированной проверки связей между сотрудниками и поставщиками. Существующая политика этики не содержит четких механизмов контроля.',
    evidenceProvided: [
      'Выписка из ЕГРЮЛ ООО "Техноком" с указанием учредителей',
      'Список договоров, заключенных Сидоровым А.И.',
      'Финансовая отчетность по закупкам',
      'Кадровые документы менеджера',
      'Заключение юридического отдела',
    ],
    proposedActions: [
      {
        taskTitle: 'Провести служебное расследование',
        description: 'Детальное расследование всех закупок, проведенных менеджером. Оценка соответствия цен рыночным.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-05T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Разработать процедуру декларирования конфликта интересов',
        description: 'Создать и внедрить процедуру обязательного декларирования конфликта интересов для всех сотрудников.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-15T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Внедрить автоматизированную проверку',
        description: 'Разработать систему автоматической проверки связей между сотрудниками и контрагентами через ЕГРЮЛ.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-20T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Провести обучение по этике',
        description: 'Организовать обязательное обучение всех сотрудников по вопросам этики и конфликта интересов.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-18T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Принять меры в отношении менеджера',
        description: 'На основании результатов расследования принять соответствующие дисциплинарные меры.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-10T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Пересмотреть все договоры с ООО "Техноком"',
        description: 'Провести аудит всех заключенных договоров на предмет соответствия рыночным условиям.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-12T23:59:59Z',
        status: 'DONE',
      },
      {
        taskTitle: 'Подготовить отчет для правления',
        description: 'Подготовить детальный отчет о случае и предпринятых мерах для правления компании.',
        assignee: 'Иван Иванов',
        dueDate: '2024-12-08T23:59:59Z',
        status: 'DONE',
      },
    ],
    estimatedImpact: 'Критическое влияние. Потенциальные финансовые потери до 1.5 млн руб (завышение цен), серьезные репутационные риски, юридические риски, возможные санкции от регуляторов. Требуется немедленное вмешательство руководства.',
    preventiveMeasures: 'Обязательное декларирование конфликта интересов при найме и ежегодно, автоматическая проверка через ЕГРЮЛ, четырехглазый принцип при закупках выше определенной суммы, независимый аудит крупных сделок, горячая линия для анонимных сообщений о нарушениях.',
    resourcesRequired: 'Значительные ресурсы: юридическое сопровождение (~300 000 руб), разработка и внедрение системы проверки (~500 000 руб), обучение персонала (80 часов), внутренний аудит (120 часов).',
    verificationStatus: 'PENDING',
  },
  'CS-2024-004': {
    caseId: 'CS-2024-004',
    actionPlanId: 'AP-2024-001',
    investigationSummary: 'Поставщик ООО "Гамма Логистика" систематически нарушает сроки поставки. Зафиксировано 7 случаев задержек за последние 3 месяца. Средняя задержка составляет 4.5 дня. Проведен анализ причин: недостаточная производственная мощность поставщика, проблемы с транспортной логистикой, отсутствие резервных поставщиков.',
    rootCauseAnalysis: 'Первопричина: недостаточная производственная мощность поставщика для выполнения принятых обязательств. Поставщик принял больше заказов, чем может обработать. Дополнительная причина: отсутствие системы мониторинга надежности поставщиков и отсутствие резервных поставщиков.',
    evidenceProvided: [
      'Журнал поставок с отметками о задержках',
      'Переписка с поставщиком о причинах задержек',
      'Протокол встречи с представителями поставщика',
      'Анализ влияния задержек на производственный процесс',
    ],
    proposedActions: [
      {
        taskTitle: 'Провести переговоры с поставщиком',
        description: 'Обсудить причины задержек и потребовать улучшения. Пересмотреть условия договора с включением штрафных санкций.',
        assignee: 'Мария Сидорова',
        dueDate: '2024-12-10T23:59:59Z',
        status: 'IN_PROGRESS',
      },
      {
        taskTitle: 'Найти резервных поставщиков',
        description: 'Провести тендер и заключить договоры с 2-3 резервными поставщиками для снижения зависимости.',
        assignee: 'Мария Сидорова',
        dueDate: '2024-12-20T23:59:59Z',
        status: 'TODO',
      },
      {
        taskTitle: 'Внедрить систему мониторинга надежности',
        description: 'Разработать и внедрить KPI для оценки надежности поставщиков с автоматическими уведомлениями.',
        assignee: 'Мария Сидорова',
        dueDate: '2024-12-25T23:59:59Z',
        status: 'TODO',
      },
    ],
    estimatedImpact: 'Среднее влияние. Срывы производственных планов, издержки на срочные закупки (~200 000 руб/месяц), риск потери клиентов из-за несоблюдения сроков.',
    preventiveMeasures: 'Создание резервного списка поставщиков, внедрение KPI надежности, диверсификация поставок, оптимизация страхового запаса, ежемесячный мониторинг выполнения обязательств.',
    resourcesRequired: 'Умеренные ресурсы: время на поиск поставщиков (40 часов), разработка системы мониторинга (~100 000 руб), юридическое сопровождение переговоров (30 000 руб).',
    verificationStatus: 'PENDING',
  },
};

// Моковая история верификаций
const mockVerificationHistory: Record<string, any[]> = {
  'CS-2024-005': [
    {
      approved: true,
      verifiedBy: 'Петр Петров (Руководитель)',
      verifiedAt: '2024-11-16T12:00:00Z',
      comments: 'Расследование проведено качественно. Подтверждено, что это было допустимое исключение.',
    },
  ],
};

// Моковые данные случаев
let mockCases: Case[] = [
  {
    id: 'CS-2024-001',
    title: 'Превышение бюджета закупки на 23%',
    description: 'Обнаружено превышение утвержденного бюджета при закупке офисной техники. Сумма превышения составляет 450 000 руб.',
    status: 'INVESTIGATING' as CaseStatus,
    severity: 'HIGH' as CaseSeverity,
    priority: 'HIGH' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-28T10:00:00Z',
    updatedAt: '2024-12-01T15:30:00Z',
    dueDate: '2024-12-10T23:59:59Z',
    incidentIds: ['INC-2024-123', 'INC-2024-124'],
    tags: ['финансы', 'бюджет', 'закупки'],
    investigationNotes: 'Проведен анализ документов. Выявлено изменение цен поставщиком после согласования.',
    rootCause: 'Отсутствие механизма контроля изменения цен после согласования бюджета',
    requiresCorrectiveAction: true,
  },
  {
    id: 'CS-2024-002',
    title: 'Дублирование записей поставщика ООО "Альфа"',
    description: 'В базе данных обнаружено три записи для одного и того же поставщика с разными идентификаторами.',
    status: 'IN_PROGRESS' as CaseStatus,
    severity: 'MEDIUM' as CaseSeverity,
    priority: 'NORMAL' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-25T09:00:00Z',
    updatedAt: '2024-11-30T14:20:00Z',
    dueDate: '2024-12-05T23:59:59Z',
    incidentIds: ['INC-2024-110'],
    tags: ['контрагенты', 'данные'],
    investigationNotes: 'Записи созданы разными сотрудниками в разное время. Требуется объединение.',
    requiresCorrectiveAction: false,
  },
  {
    id: 'CS-2024-003',
    title: 'Подозрение на конфликт интересов',
    description: 'Менеджер проводит закупки у компании, где он является совладельцем согласно данным ЕГРЮЛ.',
    status: 'OPEN' as CaseStatus,
    severity: 'CRITICAL' as CaseSeverity,
    priority: 'URGENT' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-12-01T11:00:00Z',
    updatedAt: '2024-12-01T11:00:00Z',
    dueDate: '2024-12-03T23:59:59Z',
    incidentIds: ['INC-2024-156'],
    tags: ['комплаенс', 'этика', 'критично'],
    requiresCorrectiveAction: false,
  },
  {
    id: 'CS-2024-004',
    title: 'Систематические задержки поставок',
    description: 'Поставщик ООО "Бета" систематически нарушает сроки поставки (7 случаев за 3 месяца).',
    status: 'ACTION_PLAN' as CaseStatus,
    severity: 'LOW' as CaseSeverity,
    priority: 'NORMAL' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-20T08:00:00Z',
    updatedAt: '2024-11-29T16:45:00Z',
    dueDate: '2024-12-08T23:59:59Z',
    incidentIds: ['INC-2024-098', 'INC-2024-105', 'INC-2024-112'],
    tags: ['логистика', 'поставщик'],
    investigationNotes: 'Проведена встреча с поставщиком. Выявлены проблемы с производственными мощностями.',
    rootCause: 'Недостаточная производственная мощность поставщика для выполнения обязательств',
    requiresCorrectiveAction: true,
    actionPlanId: 'AP-2024-001',
  },
  {
    id: 'CS-2024-005',
    title: 'Закрытый случай: Ложное срабатывание правила',
    description: 'Правило сработало на допустимое исключение, утвержденное руководством.',
    status: 'CLOSED' as CaseStatus,
    severity: 'LOW' as CaseSeverity,
    priority: 'LOW' as CasePriority,
    ownerId: '1',
    ownerName: 'Иван Иванов',
    createdAt: '2024-11-15T10:00:00Z',
    updatedAt: '2024-11-16T12:00:00Z',
    incidentIds: ['INC-2024-067'],
    tags: ['система', 'настройка'],
    investigationNotes: 'Подтверждено наличие утверждения от руководства.',
    rootCause: 'Правило не учитывает исключения, утвержденные руководством',
    requiresCorrectiveAction: false,
  },
];

// Комментарии к случаям
let mockComments: CaseComment[] = [
  {
    id: 'comment-1',
    caseId: 'CS-2024-001',
    authorId: '1',
    authorName: 'Иван Иванов',
    content: 'Запросил документы у отдела закупок. Ожидаю ответа в течение 2 рабочих дней.',
    createdAt: '2024-11-28T14:30:00Z',
  },
  {
    id: 'comment-2',
    caseId: 'CS-2024-001',
    authorId: '1',
    authorName: 'Иван Иванов',
    content: 'Получены документы. Подтверждено, что поставщик изменил цены после согласования без уведомления.',
    createdAt: '2024-11-29T10:15:00Z',
  },
  {
    id: 'comment-3',
    caseId: 'CS-2024-002',
    authorId: '1',
    authorName: 'Иван Иванов',
    content: 'Связался с IT-отделом для технической проверки возможности объединения записей.',
    createdAt: '2024-11-26T09:45:00Z',
  },
];

// Вложения к случаям
let mockAttachments: CaseAttachment[] = [
  {
    id: 'attach-1',
    caseId: 'CS-2024-001',
    fileName: 'Договор_поставки_123.pdf',
    fileUrl: '/files/contract_123.pdf',
    fileSize: 245000,
    fileType: 'application/pdf',
    uploadedBy: 'Иван Иванов',
    uploadedAt: '2024-11-28T15:00:00Z',
  },
  {
    id: 'attach-2',
    caseId: 'CS-2024-001',
    fileName: 'Скан_счета_на_оплату.jpg',
    fileUrl: '/files/invoice_scan.jpg',
    fileSize: 1200000,
    fileType: 'image/jpeg',
    uploadedBy: 'Иван Иванов',
    uploadedAt: '2024-11-29T11:30:00Z',
  },
  {
    id: 'attach-3',
    caseId: 'CS-2024-003',
    fileName: 'Выписка_ЕГРЮЛ.pdf',
    fileUrl: '/files/egrul.pdf',
    fileSize: 340000,
    fileType: 'application/pdf',
    uploadedBy: 'Иван Иванов',
    uploadedAt: '2024-12-01T12:00:00Z',
  },
];


export const casesHandlers = [
  // ... существующие обработчики ...
   // GET /cases/my - Получить мои случаи
  http.get(`${API_BASE_URL}/cases/my`, async () => {
    await delay(400);
    console.log('📁 [MSW] Fetching my cases');
    return HttpResponse.json(mockCases);
  }),

  // GET /cases/statistics - Статистика по случаям
  http.get(`${API_BASE_URL}/cases/statistics`, async () => {
    await delay(300);
    console.log('📊 [MSW] Fetching case statistics');
    
    const statistics = {
      total: mockCases.length,
      open: mockCases.filter(c => c.status === 'OPEN').length,
      inProgress: mockCases.filter(c => c.status === 'IN_PROGRESS').length,
      investigation: mockCases.filter(
        c =>
          c.status === 'INVESTIGATING'
          || c.status === 'ACTION_PLAN'
          || c.status === 'ACTION_IN_PROGRESS'
      ).length,
      pendingVerification: mockCases.filter(c => c.status === 'WAITING_VERIFICATION').length,
      closed: mockCases.filter(c => c.status === 'CLOSED').length,
      avgResolutionTime: 48, // В часах
    };
    
    return HttpResponse.json(statistics);
  }),

  // GET /cases/my/stats - Статистика по случаям текущего менеджера
  http.get(`${API_BASE_URL}/cases/my/stats`, async () => {
    await delay(300);
    console.log('📊 [MSW] Fetching my case stats');

    const stats = {
      total: mockCases.length,
      ASSIGNED: mockCases.filter((c) => c.status === 'ASSIGNED').length,
      ACTION_PLAN: mockCases.filter((c) => c.status === 'ACTION_PLAN').length,
      OPEN: mockCases.filter((c) => c.status === 'OPEN').length,
      INVESTIGATING: mockCases.filter((c) => c.status === 'INVESTIGATING').length,
      WAITING_VERIFICATION: mockCases.filter((c) => c.status === 'WAITING_VERIFICATION').length,
      ACTION_IN_PROGRESS: mockCases.filter((c) => c.status === 'ACTION_IN_PROGRESS').length,
      IN_PROGRESS: mockCases.filter((c) => c.status === 'IN_PROGRESS').length,
      REJECTED: mockCases.filter((c) => c.status === 'REJECTED').length,
      CLOSED: mockCases.filter((c) => c.status === 'CLOSED').length,
      avgResolutionTime: 48,
    };

    return HttpResponse.json(stats);
  }),

  // GET /cases/:caseId - Получить случай по ID
  http.get(`${API_BASE_URL}/cases/:caseId`, async ({ params }) => {
    await delay(300);
    const { caseId } = params;
    console.log(`📄 [MSW] Fetching case: ${caseId}`);
    
    const caseItem = mockCases.find(c => c.id === caseId);
    
    if (!caseItem) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(caseItem);
  }),

  // POST /cases - Создать новый случай
  http.post(`${API_BASE_URL}/cases`, async ({ request }) => {
    await delay(500);
    const body = await request.json() as CreateCaseRequest;
    console.log('➕ [MSW] Creating new case:', body);
    
    const newCase: Case = {
      id: `CS-2024-${String(mockCases.length + 1).padStart(3, '0')}`,
      title: body.title,
      description: body.description,
      status: 'OPEN' as CaseStatus,
      severity: body.severity,
      priority: body.priority,
      ownerId: '1',
      ownerName: 'Иван Иванов',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // +14 дней
      incidentIds: body.incidentIds || [],
      tags: body.tags || [],
      requiresCorrectiveAction: false,
    };
    
    mockCases.push(newCase);
    return HttpResponse.json(newCase, { status: 201 });
  }),

  // PATCH /cases/:caseId - Обновить случай
  http.patch(`${API_BASE_URL}/cases/:caseId`, async ({ request, params }) => {
    await delay(400);
    const { caseId } = params;
    const body = await request.json() as UpdateCaseRequest;
    console.log(`✏️ [MSW] Updating case ${caseId}:`, body);
    
    const index = mockCases.findIndex(c => c.id === caseId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockCases[index] = {
      ...mockCases[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockCases[index]);
  }),

  // PATCH /cases/:caseId/investigation - Обновить расследование
  http.patch(`${API_BASE_URL}/cases/:caseId/investigation`, async ({ request, params }) => {
    await delay(400);
    const { caseId } = params;
    const body = await request.json() as UpdateInvestigationRequest;
    console.log(`🕵️ [MSW] Updating investigation for case ${caseId}:`, body);

    const index = mockCases.findIndex(c => c.id === caseId);

    if (index === -1) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }

    mockCases[index] = {
      ...mockCases[index],
      investigationNotes: body.investigationNotes,
      rootCause: body.rootCause,
      requiresCorrectiveAction: body.requiresCorrectiveAction,
      status: CaseStatus.INVESTIGATING,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json(mockCases[index]);
  }),

  // POST /cases/:caseId/close - Закрыть случай
  http.post(`${API_BASE_URL}/cases/:caseId/close`, async ({ request, params }) => {
    await delay(400);
    const { caseId } = params;
    const body = await request.json() as { conclusion: string };
    console.log(`✅ [MSW] Closing case ${caseId}`);
    
    const index = mockCases.findIndex(c => c.id === caseId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    mockCases[index] = {
      ...mockCases[index],
      status: 'CLOSED' as CaseStatus,
      rootCause: body.conclusion,
      updatedAt: new Date().toISOString(),
    };
    
    return HttpResponse.json(mockCases[index]);
  }),

  // GET /cases/:caseId/comments - Получить комментарии к случаю
  http.get(`${API_BASE_URL}/cases/:caseId/comments`, async ({ params }) => {
    await delay(300);
    const { caseId } = params;
    console.log(`💬 [MSW] Fetching comments for case: ${caseId}`);
    
    const comments = mockComments.filter(c => c.caseId === caseId);
    return HttpResponse.json(comments);
  }),

  // POST /cases/:caseId/comments - Добавить комментарий
  http.post(`${API_BASE_URL}/cases/:caseId/comments`, async ({ request, params }) => {
    await delay(400);
    const { caseId } = params;
    const body = await request.json() as { content: string };
    console.log(`💬 [MSW] Adding comment to case ${caseId}`);
    
    const newComment: CaseComment = {
      id: `comment-${mockComments.length + 1}`,
      caseId: caseId as string,
      authorId: '1',
      authorName: 'Иван Иванов',
      content: body.content,
      createdAt: new Date().toISOString(),
    };
    
    mockComments.push(newComment);
    return HttpResponse.json(newComment, { status: 201 });
  }),

  // GET /cases/:caseId/attachments - Получить вложения случая
  http.get(`${API_BASE_URL}/cases/:caseId/attachments`, async ({ params }) => {
    await delay(300);
    const { caseId } = params;
    console.log(`📎 [MSW] Fetching attachments for case: ${caseId}`);
    
    const attachments = mockAttachments.filter(a => a.caseId === caseId);
    return HttpResponse.json(attachments);
  }),

  // POST /cases/:caseId/attachments - Загрузить вложение
  http.post(`${API_BASE_URL}/cases/:caseId/attachments`, async ({ request, params }) => {
    await delay(600);
    const { caseId } = params;
    console.log(`📤 [MSW] Uploading attachment to case ${caseId}`);
    
    // Симуляция получения файла из FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return HttpResponse.json(
        { message: 'Файл не предоставлен', code: 'NO_FILE' },
        { status: 400 }
      );
    }
    
    const newAttachment: CaseAttachment = {
      id: `attach-${mockAttachments.length + 1}`,
      caseId: caseId as string,
      fileName: file.name,
      fileUrl: `/files/${file.name}`,
      fileSize: file.size,
      fileType: file.type,
      uploadedBy: 'Иван Иванов',
      uploadedAt: new Date().toISOString(),
    };
    
    mockAttachments.push(newAttachment);
    return HttpResponse.json(newAttachment, { status: 201 });
  }),

  // GET /api/cases/:caseId/attachments/:attachmentId/download
  http.get(
    `${CASES_LEGACY_API_BASE}/cases/:caseId/attachments/:attachmentId/download`,
    async ({ params }) => {
      await delay(200);
      const { caseId, attachmentId } = params;
      const att = mockAttachments.find(
        (a) => a.caseId === caseId && a.id === attachmentId
      );
      if (!att) {
        return HttpResponse.json({ message: 'Вложение не найдено' }, { status: 404 });
      }
      const blob = new Blob([`Mock: ${att.fileName}`], {
        type: att.fileType || 'application/octet-stream',
      });
      return new HttpResponse(blob, {
        status: 200,
        headers: {
          'Content-Type': att.fileType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(att.fileName)}`,
        },
      });
    }
  ),

  // DELETE /api/cases/:caseId/attachments/:attachmentId
  http.delete(
    `${CASES_LEGACY_API_BASE}/cases/:caseId/attachments/:attachmentId`,
    async ({ params }) => {
      await delay(200);
      const { caseId, attachmentId } = params;
      const idx = mockAttachments.findIndex(
        (a) => a.caseId === caseId && a.id === attachmentId
      );
      if (idx === -1) {
        return HttpResponse.json({ message: 'Вложение не найдено' }, { status: 404 });
      }
      mockAttachments.splice(idx, 1);
      return new HttpResponse(null, { status: 204 });
    }
  ),

  // GET /cases/:caseId/verification-details - Получить детали для верификации
  http.get(`${API_BASE_URL}/cases/:caseId/verification-details`, async ({ params }) => {
    await delay(500);
    const { caseId } = params;
    console.log(`🔍 [MSW] Fetching verification details for case: ${caseId}`);
    
    const details = mockVerificationDetails[caseId as string];
    
    if (!details) {
      return HttpResponse.json(
        { message: 'Детали верификации не найдены', code: 'VERIFICATION_DETAILS_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    return HttpResponse.json(details);
  }),

  // POST /cases/:caseId/verify - Верифицировать случай
  http.post(`${API_BASE_URL}/cases/:caseId/verify`, async ({ request, params }) => {
    await delay(600);
    const { caseId } = params;
    const body = await request.json() as VerificationDecision;
    console.log(`✅ [MSW] Verifying case ${caseId}:`, body);
    
    const index = mockCases.findIndex(c => c.id === caseId);
    
    if (index === -1) {
      return HttpResponse.json(
        { message: 'Случай не найден', code: 'CASE_NOT_FOUND' },
        { status: 404 }
      );
    }
    
    // Обновить статус случая
    mockCases[index] = {
      ...mockCases[index],
      status: body.approved ? CaseStatus.CLOSED : CaseStatus.REJECTED,
      updatedAt: new Date().toISOString(),
    };
    
    // Добавить запись в историю верификаций
    if (!mockVerificationHistory[caseId as string]) {
      mockVerificationHistory[caseId as string] = [];
    }
    
    mockVerificationHistory[caseId as string].push({
      approved: body.approved,
      verifiedBy: 'Петр Петров (Руководитель)',
      verifiedAt: new Date().toISOString(),
      comments: body.comments,
      rejectionReason: body.rejectionReason,
      recommendations: body.recommendations,
      followUpRequired: body.followUpRequired,
    });
    
    return HttpResponse.json(mockCases[index]);
  }),

  // GET /cases/:caseId/verification-history - Получить историю верификаций
  http.get(`${API_BASE_URL}/cases/:caseId/verification-history`, async ({ params }) => {
    await delay(400);
    const { caseId } = params;
    console.log(`📜 [MSW] Fetching verification history for case: ${caseId}`);
    
    const history = mockVerificationHistory[caseId as string] || [];
    return HttpResponse.json(history);
  }),
];

