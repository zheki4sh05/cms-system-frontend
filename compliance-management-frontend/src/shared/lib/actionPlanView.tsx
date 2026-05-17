import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  DeleteOutline as DeleteOutlineIcon,
  ExpandMore as ExpandMoreIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  getTaskStatusLabelRu,
  getWorkflowPriorityLabelRu,
} from '@shared/lib/domainLabelsRu';
import type { Task, TaskPriority, TaskStatus } from '@shared/types/taskTypes';

function stringifyDetailValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

function detailSeverityLabel(severity: string): string {
  const u = severity.toUpperCase();
  const labels: Record<string, string> = {
    LOW: 'Низкая',
    MEDIUM: 'Средняя',
    HIGH: 'Высокая',
    CRITICAL: 'Критичная',
  };
  return labels[u] || severity;
}

function humanizeDetailKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).trim();
}

export interface ActionPlanRiskObjectCaptionProps {
  riskObjectName?: string;
  caseTitle?: string;
  caseId: string;
}

/** Строка над блоком просмотра плана */
export function ActionPlanRiskObjectCaption({
  riskObjectName,
  caseTitle,
  caseId,
}: ActionPlanRiskObjectCaptionProps) {
  const name = riskObjectName?.trim();
  if (name) {
    return (
      <Typography variant="body2" sx={{ mb: 2 }}>
        План для разрешения случая связанного с рисковым объектом{' '}
        <Box component="span" sx={{ fontWeight: 700 }}>
          {name}
        </Box>
        .
      </Typography>
    );
  }
  return (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      План для разрешения случая: {caseTitle ?? caseId}
    </Typography>
  );
}

export interface ActionPlanDetailsSectionProps {
  details?: Record<string, unknown> | null;
}

/** Блок «Детали» в стиле карточки просмотра инцидента */
export function ActionPlanDetailsSection({ details }: ActionPlanDetailsSectionProps) {
  if (!details || Object.keys(details).length === 0) {
    return null;
  }

  const title = typeof details.title === 'string' ? details.title : undefined;
  const severity = typeof details.severity === 'string' ? details.severity : undefined;
  const description = typeof details.description === 'string' ? details.description : undefined;
  const recommendation =
    typeof details.recommendation === 'string' ? details.recommendation : undefined;

  const findingLike = title || severity || description || recommendation;

  if (findingLike) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Детали
        </Typography>
        <Paper sx={{ p: 1.5, bgcolor: 'grey.50' }}>
          <Stack spacing={1}>
            {title && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Заголовок
                </Typography>
                <Typography variant="body2">{title}</Typography>
              </Box>
            )}
            {severity && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Критичность риска
                </Typography>
                <Typography variant="body2">{detailSeverityLabel(severity)}</Typography>
              </Box>
            )}
            {description && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Описание
                </Typography>
                <Typography variant="body2">{description}</Typography>
              </Box>
            )}
            {recommendation && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Рекомендация
                </Typography>
                <Typography variant="body2">{recommendation}</Typography>
              </Box>
            )}
            {Object.entries(details).some(
              ([k]) =>
                k !== 'title' && k !== 'severity' && k !== 'description' && k !== 'recommendation'
            ) && (
              <ExtraDetailFields
                details={details}
                excludeKeys={['title', 'severity', 'description', 'recommendation']}
              />
            )}
          </Stack>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" gutterBottom>
        Детали
      </Typography>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {Object.entries(details).map(([key, value]) => (
            <Grid key={key} size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary">
                {humanizeDetailKey(key)}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {stringifyDetailValue(value)}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}

function formatTaskDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ru-RU');
}

function TaskDetailField({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {value}
      </Typography>
    </Box>
  );
}

function taskStatusChipColor(status: TaskStatus): 'default' | 'primary' | 'success' | 'error' {
  switch (status) {
    case 'IN_PROGRESS':
      return 'primary';
    case 'DONE':
      return 'success';
    case 'BLOCKED':
      return 'error';
    default:
      return 'default';
  }
}

function taskPriorityChipColor(priority: TaskPriority): 'default' | 'info' | 'warning' | 'success' {
  switch (priority) {
    case 'URGENT':
    case 'HIGH':
      return 'warning';
    case 'NORMAL':
      return 'info';
    case 'LOW':
      return 'success';
    default:
      return 'default';
  }
}

export interface ActionPlanTasksAccordionProps {
  planId: string;
  tasks: Task[];
  onDeleteTask?: (planId: string, taskId: string) => void;
  deleteDisabled?: boolean;
}

/** Список задач плана с раскрывающимися деталями из GET /action-plans */
export function ActionPlanTasksAccordion({
  planId,
  tasks,
  onDeleteTask,
  deleteDisabled = false,
}: ActionPlanTasksAccordionProps) {
  if (tasks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Задачи не добавлены
      </Typography>
    );
  }

  return (
    <Stack spacing={1}>
      {tasks.map((task, taskIndex) => (
        <Accordion
          key={task.id || `plan-task-${taskIndex}`}
          disableGutters
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              '& .MuiAccordionSummary-content': {
                alignItems: 'center',
                gap: 1,
                my: 0.5,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
              {task.status === 'DONE' ? (
                <CheckIcon color="success" fontSize="small" />
              ) : (
                <ScheduleIcon color="action" fontSize="small" />
              )}
              <Typography variant="subtitle2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                {task.title || `Задача #${taskIndex + 1}`}
              </Typography>
              <Chip
                label={getTaskStatusLabelRu(task.status)}
                size="small"
                color={taskStatusChipColor(task.status)}
              />
              <Chip
                label={getWorkflowPriorityLabelRu(task.priority)}
                size="small"
                color={taskPriorityChipColor(task.priority)}
              />
            </Box>
            {task.id && onDeleteTask ? (
              <Tooltip title="Удалить задачу">
                <span>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label="Удалить задачу"
                    disabled={deleteDisabled}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteTask(planId, task.id);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : null}
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0, borderTop: 1, borderColor: 'divider' }}>
            <TaskDetailField label="Описание" value={task.description} />
            <TaskDetailField label="Рекомендация" value={task.recommendation} />
            <TaskDetailField label="Исполнитель" value={task.assigneeName} />
            <TaskDetailField label="Срок выполнения" value={formatTaskDateTime(task.dueDate)} />
            {task.completedAt ? (
              <TaskDetailField label="Завершена" value={formatTaskDateTime(task.completedAt)} />
            ) : null}
            <TaskDetailField label="Доказательство выполнения" value={task.evidenceDescription} />
            {typeof task.comment === 'string' && task.comment.trim() ? (
              <TaskDetailField label="Комментарий" value={task.comment} />
            ) : null}
            {task.details &&
              Object.entries(task.details)
                .filter(
                  ([key]) =>
                    !['title', 'severity', 'description', 'recommendation'].includes(key)
                )
                .map(([key, value]) => (
                  <Box key={key} sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {humanizeDetailKey(key)}
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {stringifyDetailValue(value)}
                    </Typography>
                  </Box>
                ))}
          </AccordionDetails>
        </Accordion>
      ))}
    </Stack>
  );
}

function ExtraDetailFields({
  details,
  excludeKeys,
}: {
  details: Record<string, unknown>;
  excludeKeys: string[];
}) {
  const rest = Object.entries(details).filter(([k]) => !excludeKeys.includes(k));
  if (rest.length === 0) return null;

  return (
    <Stack spacing={1} sx={{ pt: 1, borderTop: 1, borderColor: 'divider' }}>
      {rest.map(([key, value]) => (
        <Box key={key}>
          <Typography variant="caption" color="text.secondary">
            {humanizeDetailKey(key)}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {stringifyDetailValue(value)}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
