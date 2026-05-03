import { Box, Grid, Paper, Stack, Typography } from '@mui/material';

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
