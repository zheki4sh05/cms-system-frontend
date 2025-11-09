import { type FC, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import { BusinessOutlined } from '@mui/icons-material';

interface CreateDepartmentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description?: string) => Promise<void>;
}

export const CreateDepartmentDialog: FC<CreateDepartmentDialogProps> = ({
  open,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!name.trim()) {
      setError('Введите название департамента');
      return;
    }

    if (name.length < 3) {
      setError('Название должно содержать минимум 3 символа');
      return;
    }

    setLoading(true);

    try {
      await onCreate(name.trim(), description.trim() || undefined);
      setSuccess(`Департамент "${name}" успешно создан`);

      setTimeout(() => {
        setName('');
        setDescription('');
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании департамента');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      setError('');
      setSuccess('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BusinessOutlined color="primary" />
          <Typography variant="h6">Создать департамент</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success">
              {success}
            </Alert>
          )}

          <TextField
            label="Название департамента"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Отдел закупок"
            fullWidth
            required
            disabled={loading}
            helperText="Уникальное название департамента"
          />

          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание департамента..."
            fullWidth
            multiline
            rows={3}
            disabled={loading}
            helperText="Необязательное поле"
          />

          <Alert severity="info">
            <Typography variant="body2">
              После создания департамента вы сможете назначить руководителя
              и перевести сотрудников.
            </Typography>
          </Alert>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
        >
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !!success}
          startIcon={loading ? <CircularProgress size={20} /> : <BusinessOutlined />}
        >
          {loading ? 'Создание...' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};