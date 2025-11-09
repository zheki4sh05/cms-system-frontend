
import { type FC, useState, useEffect } from 'react';
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
import { EditOutlined } from '@mui/icons-material';
import type { Department } from '@shared/types/departmentTypes';

interface EditDepartmentDialogProps {
  open: boolean;
  onClose: () => void;
  department: Department | null;
  onUpdate: (id: string, name: string, description?: string) => Promise<void>;
}

export const EditDepartmentDialog: FC<EditDepartmentDialogProps> = ({
  open,
  onClose,
  department,
  onUpdate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (department) {
      setName(department.name);
      setDescription(department.description || '');
    }
  }, [department]);

  const handleSubmit = async () => {
    if (!department) return;

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
      await onUpdate(department.id, name.trim(), description.trim() || undefined);
      setSuccess('Департамент успешно обновлен');

      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Ошибка при обновлении департамента');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
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
          <EditOutlined color="primary" />
          <Typography variant="h6">Редактировать департамент</Typography>
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
            fullWidth
            required
            disabled={loading}
          />

          <TextField
            label="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={3}
            disabled={loading}
          />
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
          startIcon={loading ? <CircularProgress size={20} /> : <EditOutlined />}
        >
          {loading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};