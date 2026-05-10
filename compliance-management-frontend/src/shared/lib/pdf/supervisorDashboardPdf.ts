// Генерация PDF отчёта по данным панели руководителя (клиент, jsPDF).

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  IncidentProblemAreasResponse,
  IncidentsOverviewResponse,
  IncidentWorkflowStatusOverview,
} from '@shared/types/incidentTypes';
import type {
  PendingVerificationItem,
  RuleEffectiveness,
  SupervisorDashboardStats,
  TeamKPI,
} from '@shared/types/supervisorTypes';

/** Roboto hinted TTF из googlefonts/roboto (кириллица + латиница) */
const ROBOTO_TTF_FALLBACK_URLS = [
  'https://raw.githubusercontent.com/googlefonts/roboto/main/src/hinted/Roboto-Regular.ttf',
];

export interface SupervisorDashboardPdfInput {
  generatedAt: Date;
  /** Имя для титула, например «Иван Иванов» */
  userDisplayName?: string;
  /** Строка подразделения */
  departmentLine?: string;
  stats: SupervisorDashboardStats | null;
  teamKPI: TeamKPI[];
  verificationQueue: PendingVerificationItem[];
  problemAreasData: IncidentProblemAreasResponse | null;
  incidentsOverview: IncidentsOverviewResponse | null;
  ruleEffectiveness: RuleEffectiveness[];
}

type JsPdfWithFinalY = jsPDF & { lastAutoTable?: { finalY: number } };

function escapeCell(v: unknown, maxLen = 200): string {
  const s =
    v === null || v === undefined
      ? '—'
      : typeof v === 'object'
        ? JSON.stringify(v).slice(0, maxLen)
        : String(v);
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t || '—';
}

async function arrayBufferToBase64(buf: ArrayBuffer): Promise<string> {
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== 'string') {
        reject(new Error('FileReader вернул неожиданный тип'));
        return;
      }
      const comma = r.indexOf(',');
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(blob);
  });
}

async function loadRobotoBase64(): Promise<string> {
  let lastErr: unknown;
  for (const url of ROBOTO_TTF_FALLBACK_URLS) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await arrayBufferToBase64(await res.arrayBuffer());
    } catch (e) {
      lastErr = e;
      console.warn(`[PDF] не удалось загрузить шрифт с ${url}`, e);
    }
  }
  throw new Error(
    `Не удалось загрузить шрифт Roboto для кириллицы. Проверьте сеть. ${String(lastErr)}`
  );
}

function registerRoboto(doc: jsPDF, base64: string): void {
  doc.addFileToVFS('Roboto-Regular.ttf', base64);
  // WinAnsi/StandardEncoding не покрывают кириллицу — нужен Unicode (CMap Identity-H)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal', 'normal', 'Identity-H');
  doc.setFont('Roboto', 'normal');
}

const FONT = 'Roboto';
const BASE_FS = 9;
const H1 = 16;
const H2 = 11;

const WF_STATUS_LABEL: Record<IncidentWorkflowStatusOverview, string> = {
  OPEN: 'Открыты',
  PARTLY_PROGRESS: 'Частично в работе',
  IN_PROGRESS: 'В работе',
  RESOLVED: 'Решены',
};
const WF_ORDER: IncidentWorkflowStatusOverview[] = [
  'OPEN',
  'PARTLY_PROGRESS',
  'IN_PROGRESS',
  'RESOLVED',
];

const RISK_SEVERITY_MONITORING_RU: Record<'low' | 'medium' | 'high' | 'unknown', string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  unknown: 'Неизвестно',
};

/** Доля без NaN */
function pct(n: number, d: number): string {
  return d > 0 ? `${Math.round((n / d) * 1000) / 10}%` : '0%';
}

function fmtDateRu(d: Date): string {
  return d.toLocaleString('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function responsibleBrief(p: PendingVerificationItem['responsible']): string {
  const fn = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
  if (fn) return escapeCell(fn, 48);
  if (p.userId) return `Пользователь ${escapeCell(p.userId, 36)}`;
  if (p.employeeId) return `Сотрудник ${escapeCell(p.employeeId, 36)}`;
  return '—';
}

export async function downloadSupervisorDashboardPdf(
  input: SupervisorDashboardPdfInput
): Promise<void> {
  const fontB64 = await loadRobotoBase64();
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  registerRoboto(doc, fontB64);

  const margin = 40;
  let y = margin;

  const tableCommon = {
    styles: { font: FONT, fontStyle: 'normal', fontSize: BASE_FS, cellPadding: 3 },
    headStyles: {
      fillColor: [25, 118, 210],
      font: FONT,
      fontStyle: 'normal',
      fontSize: BASE_FS,
    },
    margin: { top: margin, left: margin, right: margin, bottom: margin },
    showHead: 'firstPage' as const,
    theme: 'striped' as const,
  };

  const bumpAfterTable = (): void => {
    const last = (doc as JsPdfWithFinalY).lastAutoTable?.finalY;
    y = typeof last === 'number' ? last + 28 : y + 140;
    if (y > doc.internal.pageSize.getHeight() - margin - 80) {
      doc.addPage();
      doc.setFont(FONT, 'normal');
      y = margin;
    }
  };

  doc.setFontSize(H1);
  doc.setTextColor(20);
  doc.text('Панель руководителя — экспорт данных', margin, y);
  y += 26;

  doc.setFontSize(BASE_FS);
  doc.setTextColor(70);
  doc.text(`Сформировано: ${fmtDateRu(input.generatedAt)}`, margin, y);
  y += 16;
  if (input.userDisplayName) {
    doc.text(`Пользователь: ${escapeCell(input.userDisplayName, 120)}`, margin, y);
    y += 14;
  }
  if (input.departmentLine) {
    doc.text(`Подразделение: ${escapeCell(input.departmentLine, 120)}`, margin, y);
    y += 14;
  }
  y += 14;

  // --- KPI сверху (из stats API) ---
  doc.setFontSize(H2);
  doc.setTextColor(20);
  doc.text('Сводные метрики (API my/stats)', margin, y);
  y += 18;
  doc.setFontSize(BASE_FS);
  doc.setTextColor(0);

  const statRows =
    input.stats === null
      ? [['нет данных', '—']]
      : [
          ['Критичные инциденты', String(input.stats.criticalIncidents)],
          ['Просроченные планы', String(input.stats.overdueActionPlans)],
          ['Ожидают проверки', String(input.stats.pendingVerifications)],
          ['Ср. время решения (ч)', String(input.stats.avgResolutionTime)],
          ['Всего инцидентов', String(input.stats.totalIncidents)],
          ['Всего кейсов', String(input.stats.totalCases)],
          ['Всего планов действий', String(input.stats.totalActionPlans)],
        ];

  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [['Показатель', 'Значение']],
    body: statRows,
  });
  bumpAfterTable();

  // --- Обзор /api/incidents/overview ---
  if (input.incidentsOverview) {
    doc.setFontSize(H2);
    doc.text('Обзор инцидентов (/api/incidents/overview)', margin, y);
    y += 18;
    doc.setFontSize(BASE_FS);
      const o = input.incidentsOverview;
      const scopeRu =
        o.scope === 'COMPANY' ? 'Вся компания' : 'Подчинённые отдела';
      doc.text(`Область: ${scopeRu}`, margin, y);
      y += 16;

      const statusTotal = WF_ORDER.reduce(
        (s, k) => s + (o.incidents.byStatus[k] ?? 0),
        0
      );
      const statusBody = WF_ORDER.map((k) => [
        WF_STATUS_LABEL[k],
        String(o.incidents.byStatus[k] ?? 0),
        pct(o.incidents.byStatus[k] ?? 0, statusTotal),
      ]);
      autoTable(doc, {
        ...tableCommon,
        startY: y,
        head: [['Статус', 'Шт.', 'Доля']],
        body: statusBody,
      });
      bumpAfterTable();

      doc.setFontSize(H2);
      doc.text('Связь с объектом наблюдения и стейл', margin, y);
      y += 16;
      doc.setFontSize(BASE_FS);
      autoTable(doc, {
        ...tableCommon,
        startY: y,
        head: [['Параметр', 'Значение']],
        body: [
          ['С номером объекта наблюдения', String(o.incidents.withDocumentId)],
          ['Без номера объекта наблюдения', String(o.incidents.withoutDocumentId)],
          ['Устарели без решения (>14 дн.)', String(o.incidents.staleUnresolved)],
        ],
      });
      bumpAfterTable();

      doc.setFontSize(H2);
      doc.text('Обнаружения и кейсы', margin, y);
      y += 16;
      doc.setFontSize(BASE_FS);
      autoTable(doc, {
        ...tableCommon,
        startY: y,
        head: [['Параметр', 'Значение']],
        body: [
          ['Обнаружения всего', String(o.findings.total)],
          ['Обнаружения без назначенного пользователя', String(o.findings.withoutAssignedUser)],
          ['Кейсы всего', String(o.cases.total)],
          ['Ожидание верификации', String(o.cases.waitingVerification)],
          ['Закрыты', String(o.cases.closed)],
          ['Прочие', String(o.cases.other)],
          ['Планы с просроч. задачами', String(o.actionPlans.withOverdueTasks)],
        ],
      });
      bumpAfterTable();

      doc.setFontSize(H2);
      doc.text('Точки риска (топ)', margin, y);
      y += 16;
      doc.setFontSize(BASE_FS);
      const hotspots =
        o.riskHotspots.length === 0
          ? [['—', '0']]
          : o.riskHotspots.map((h) => [
              escapeCell(h.name || h.riskObjectId, 64),
              String(h.incidentCount),
            ]);
      autoTable(doc, {
        ...tableCommon,
        startY: y,
        head: [['Объект риска / идентификатор', 'Инцидентов']],
        body: hotspots,
      });
      bumpAfterTable();

      doc.setFontSize(H2);
      doc.text('Серьёзность объекта риска (мониторинг)', margin, y);
      y += 16;
      doc.setFontSize(BASE_FS);
      const sev = o.incidentsByRiskObjectSeverity;
      const sevT = sev.low + sev.medium + sev.high + sev.unknown;
      autoTable(doc, {
        ...tableCommon,
        startY: y,
        head: [['Уровень', 'Шт.', 'Доля']],
        body: (
          [
            [RISK_SEVERITY_MONITORING_RU.low, sev.low],
            [RISK_SEVERITY_MONITORING_RU.medium, sev.medium],
            [RISK_SEVERITY_MONITORING_RU.high, sev.high],
            [RISK_SEVERITY_MONITORING_RU.unknown, sev.unknown],
          ] as const
        ).map(([label, cnt]) => [label, String(cnt), pct(cnt, sevT)]),
      });
      bumpAfterTable();
  }

  doc.setFontSize(H2);
  doc.text('KPI команды (менеджеры)', margin, y);
  y += 18;
  const kpiRows =
    input.teamKPI.length === 0
      ? [['—', '', '', '', '']]
      : input.teamKPI.map((m) => [
          escapeCell(m.managerName, 40),
          `${m.resolvedIncidents}/${m.assignedIncidents}`,
          `${m.activeCases}/${m.completedCases}`,
          String(m.avgResolutionTime),
          `${m.onTimeCompletion}%`,
        ]);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [['Менеджер', 'Инц. реш./все', 'Кейсы акт./закр.', 'Ср.ч', 'В срок %']],
    body: kpiRows,
  });
  bumpAfterTable();

  doc.setFontSize(H2);
  doc.text('Очередь верификации', margin, y);
  y += 18;
  const vRows =
    input.verificationQueue.length === 0
      ? [['—', '', '', '']]
      : input.verificationQueue.map((item) => [
          escapeCell(verificationListTitle(item), 50),
          escapeCell(item.incidentId, 24),
          escapeCell(item.actionPlanId, 24),
          responsibleBrief(item.responsible),
        ]);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [['Документ / тема', 'Инцидент', 'План', 'Ответственный']],
    body: vRows,
  });
  bumpAfterTable();

  doc.setFontSize(H2);
  doc.text('Проблемные зоны (повтор по номеру объекта наблюдения)', margin, y);
  y += 18;
  const groups = input.problemAreasData?.groups ?? [];
  const pRows =
    groups.length === 0
      ? [['—', '0']]
      : groups.map((g) => [
          escapeCell(`${g.documentId} — ${riskTitleFromGroup(g)}`, 76),
          String(g.incidentCount),
        ]);
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [['Номер объекта наблюдения / заголовок', 'Инц. в месяце']],
    body: pRows,
  });
  bumpAfterTable();

  doc.setFontSize(H2);
  doc.text('Эффективность правил', margin, y);
  y += 18;
  const ruleRows =
    input.ruleEffectiveness.length === 0
      ? [['—', '', '', '', '', '']]
      : input.ruleEffectiveness.map((r) => {
          const name = (r.ruleName ?? '').trim();
          const cat = (r.categoryName ?? '').trim() || r.categoryId || '—';
          const total = r.rejectedCount + r.closedCount;
          return [
            escapeCell(name || r.ruleId, 32),
            escapeCell(cat, 22),
            String(r.rejectedCount),
            String(r.closedCount),
            String(total),
            r.ruleActive ? 'Да' : 'Нет',
          ];
        });
  autoTable(doc, {
    ...tableCommon,
    startY: y,
    head: [
      ['Правило', 'Категория', 'Откл.', 'Закр.', 'Всего', 'Активно'],
    ],
    body: ruleRows,
  });
  bumpAfterTable();

  const slug = input.generatedAt.toISOString().split('T')[0];
  doc.save(`supervisor-dashboard_${slug}.pdf`);
}

/** Дубль логики UI для PDF (без циклических импортов страницы) */
function verificationListTitle(item: PendingVerificationItem): string {
  const t = item.documentTitle?.trim();
  return t || 'Документ без названия';
}

function riskTitleFromGroup(g: IncidentProblemAreasResponse['groups'][0]): string {
  const nameRaw = g.incidents[0]?.incident?.riskObjectName;
  const name =
    typeof nameRaw === 'string'
      ? nameRaw.trim()
      : nameRaw !== undefined && nameRaw !== null
        ? String(nameRaw).trim()
        : '';
  return name || '(без имени объекта)';
}
