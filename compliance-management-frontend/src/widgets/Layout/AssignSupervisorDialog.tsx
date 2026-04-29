import { type FC, useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Alert,
  CircularProgress,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { PersonOutlineOutlined } from '@mui/icons-material';
import { EmployeeApi } from '@shared/lib/api/employeeApi';
import type { Department } from '@shared/types/departmentTypes';
import type { User } from '@shared/types/customTypes';
import { UserRoleValues } from '@shared/types/customTypes';

interface AssignSupervisorDialogProps {
  open: boolean;
  onClose: () => void;
  department: Department | null;
  companyId: string | null;
  onAssign: (departmentId: string, managerId: string, companyId?: string) => Promise<void>;
}

export const AssignSupervisorDialog: FC<AssignSupervisorDialogProps> = ({
  open,
  onClose,
  department,
  companyId,
  onAssign,
}) => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const eligibleEmployees = useMemo(
    () => employees.filter((user) => user.role === UserRoleValues.MANAGER),
    [employees]
  );

  useEffect(() => {
    if (!open || !department) {
      return;
    }

    setSelectedManagerId(department.managerId ?? '');
  }, [open, department]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!companyId) {
      setEmployees([]);
      setError('Не удалось определить компанию');
      return;
    }

    setError('');
    setIsLoadingEmployees(true);

    void EmployeeApi.getEmployeesByCompanyId(companyId)
      .then((list) => {
        setEmployees(list);
      })
      .catch(() => {
        setEmployees([]);
        setError('Не удалось загрузить список сотрудников');
      })
      .finally(() => {
        setIsLoadingEmployees(false);
      });
  }, [open, companyId]);

  const handleSubmit = async () => {
    if (!department) {
      return;
    }

    if (!selectedManagerId) {
      setError('Выберите руководителя');
      return;
    }

    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      await onAssign(department.id, selectedManagerId, companyId ?? undefined);
      setSuccess('Руководитель успешно назначен');
      setTimeout(() => {
        setSuccess('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Не удалось назначить руководителя');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    setError('');
    setSuccess('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonOutlineOutlined color="primary" />
          <Typography variant="h6">Назначить руководителя</Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {department && (
            <Alert severity="info">
              <Typography variant="body2">
                Департамент: {department.name}
              </Typography>
            </Alert>
          )}

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && <Alert severity="success">{success}</Alert>}

          {isLoadingEmployees ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <FormControl fullWidth>
              <InputLabel id="department-supervisor-label">Руководитель</InputLabel>
              <Select
                labelId="department-supervisor-label"
                value={selectedManagerId}
                label="Руководитель"
                onChange={(event) => setSelectedManagerId(String(event.target.value))}
                disabled={isSubmitting}
              >
                {eligibleEmployees.map((employee) => (
                  <MenuItem key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName} ({employee.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {!isLoadingEmployees && eligibleEmployees.length === 0 && (
            <Alert severity="warning">
              В компании нет доступных сотрудников с ролью менеджера.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || isLoadingEmployees || !eligibleEmployees.length}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <PersonOutlineOutlined />}
        >
          {isSubmitting ? 'Сохранение...' : 'Назначить'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
