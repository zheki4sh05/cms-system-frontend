import { useState, useEffect, type FC } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  Stack,
  Paper,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  ApartmentOutlined,
  PeopleOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '@features/auth/useAuthStore';
import { CompanyApi } from '@shared/lib/api/companyApi';
import type { CompanyProfile } from '@shared/types/companyTypes';

interface CompanyDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const CompanyDrawer: FC<CompanyDrawerProps> = observer(({ open, onClose }) => {
  const authStore = useAuthStore();
  const canEditCompanyName = authStore.isExecutive;

  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [draftName, setDraftName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadError(null);
      setSaveError(null);
      setIsLoading(true);
      try {
        const data = await CompanyApi.getCompany();
        if (!cancelled) {
          setCompany(data);
          setDraftName(data.name);
        }
      } catch (error) {
        console.error('Failed to load company:', error);
        if (!cancelled) {
          setLoadError('Не удалось загрузить данные компании');
          setCompany(null);
          setDraftName('');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSave = async () => {
    if (!canEditCompanyName || !company || draftName.trim() === '' || draftName.trim() === company.name) {
      return;
    }

    setSaveError(null);
    setIsSaving(true);
    try {
      const updated = await CompanyApi.updateCompany({ name: draftName.trim() });
      setCompany(updated);
      setDraftName(updated.name);
    } catch (error) {
      console.error('Failed to update company name:', error);
      setSaveError('Не удалось сохранить наименование');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: '80%',
          maxWidth: 640,
        },
      }}
    >
      <Box
        sx={{
          p: 3,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }} component="div">
            Компания
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }} component="div">
            Общая информация о компании
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        {loadError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {loadError}
          </Alert>
        )}

        {saveError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {!canEditCompanyName && !loadError && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Для редактирования наименования компании обратитесь к топ-менеджменту.
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 3 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ApartmentOutlined color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Профиль компании
                </Typography>
              </Box>

              <TextField
                label="Наименование"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                fullWidth
                size="small"
                disabled={!company || !canEditCompanyName || isSaving}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PeopleOutlined fontSize="small" color="action" />
                <Typography variant="body1">
                  Количество сотрудников: {company?.employeeCount ?? '—'}
                </Typography>
              </Box>

              {canEditCompanyName && company && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveOutlined />}
                    onClick={handleSave}
                    disabled={
                      isSaving ||
                      draftName.trim().length < 2 ||
                      draftName.trim() === company.name
                    }
                  >
                    Сохранить
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Paper>
      </Box>
    </Drawer>
  );
});
