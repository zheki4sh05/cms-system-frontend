import { observer } from 'mobx-react-lite';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  List,
  Button,
  Stack,
  Paper,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  BusinessOutlined,
  PeopleOutlined,
  EditOutlined,
  MoreVert as MoreVertIcon,
  PersonOutlineOutlined,
  SwapHorizOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '@features/auth/useAuthStore';
import { CreateDepartmentDialog } from './CreateDepartmentDialog';
import { EditDepartmentDialog } from './EditDepartmentDialog';
import { type Department } from '@shared/types/departmentTypes';
import { useState, useEffect, useCallback, type FC } from 'react';
import { DepartmentApi } from '@shared/lib/api/departmentApi';
import { CompanyApi } from '@shared/lib/api/companyApi';

interface DepartmentsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const DepartmentsDrawer: FC<DepartmentsDrawerProps> = observer(({ open, onClose }) => {
  const authStore = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuDepartment, setMenuDepartment] = useState<Department | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Только топ-менеджмент может создавать и редактировать
  const canManageDepartments = authStore.isExecutive;

  const loadDepartments = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;
      setLoadError(null);
      if (!silent) {
        setIsLoading(true);
      }
      try {
        let cid = authStore.user?.companyId ?? null;
        if (!cid) {
          const company = await CompanyApi.getCompany();
          cid = company.id;
        }
        if (!cid) {
          setCompanyId(null);
          setDepartments([]);
          setLoadError('Не удалось определить компанию');
          return;
        }

        setCompanyId(cid);
        const list = await DepartmentApi.getDepartmentsByCompanyId(cid);
        setDepartments(list);
      } catch (error) {
        console.error('Failed to load departments:', error);
        setDepartments([]);
        setLoadError('Не удалось загрузить список департаментов');
      } finally {
        if (!silent) {
          setIsLoading(false);
        }
      }
    },
    [authStore.user?.companyId]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadDepartments();
  }, [open, loadDepartments]);

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (dept.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, dept: Department) => {
    setAnchorEl(event.currentTarget);
    setMenuDepartment(dept);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuDepartment(null);
  };

  const handleEdit = () => {
    if (menuDepartment) {
      setSelectedDepartment(menuDepartment);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleCreate = async (name: string, description?: string) => {
    const cid = companyId ?? authStore.user?.companyId ?? null;
    if (!cid) {
      console.error('Cannot create department: unknown company');
      return;
    }

    await DepartmentApi.createDepartment({
      name,
      description,
      companyId: cid,
    });
    await loadDepartments({ silent: true });
  };

  const handleUpdate = async (id: string, name: string, description?: string) => {
    await DepartmentApi.updateDepartment(id, { name, description });
    await loadDepartments({ silent: true });
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: '80%',
            maxWidth: 800,
          },
        }}
      >
        {/* Header */}
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
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              Департаменты
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Управление структурой организации
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {loadError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {loadError}
            </Alert>
          )}

          {/* Search and Create */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              placeholder="Поиск департаментов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              size="small"
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {canManageDepartments && (
              <Button
                variant="contained"
                startIcon={<BusinessOutlined />}
                onClick={() => setCreateDialogOpen(true)}
                disabled={isLoading || Boolean(loadError)}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Создать
              </Button>
            )}
          </Stack>

          {/* Info для не-топ-менеджмента */}
          {!canManageDepartments && !loadError && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                Режим просмотра. Для создания и редактирования департаментов
                обратитесь к топ-менеджменту.
              </Typography>
            </Alert>
          )}

          {/* Departments List */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Найдено департаментов: {filteredDepartments.length}
          </Typography>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <List sx={{ bgcolor: 'background.paper' }}>
              {filteredDepartments.map((dept) => (
                <Paper
                  key={dept.id}
                  variant="outlined"
                  sx={{ mb: 2, overflow: 'hidden' }}
                >
                  <Box sx={{ p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <BusinessOutlined color="primary" />
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {dept.name}
                          </Typography>
                          <Chip
                            label={dept.id}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        {dept.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {dept.description}
                          </Typography>
                        )}
                      </Box>

                      {canManageDepartments && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, dept)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      )}
                    </Box>

                    {/* Stats */}
                    <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleOutlined fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Сотрудников: {dept.employeeCount}
                        </Typography>
                      </Box>

                      {dept.managerName && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonOutlineOutlined fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Руководитель: {dept.managerName}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {/* Dates */}
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary">
                        Создан: {new Date(dept.createdAt).toLocaleDateString('ru-RU')} •
                        Обновлен: {new Date(dept.updatedAt).toLocaleDateString('ru-RU')}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </List>
          )}

          {!isLoading && filteredDepartments.length === 0 && !loadError && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Департаменты не найдены
              </Typography>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          Редактировать
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <SwapHorizOutlined fontSize="small" />
          </ListItemIcon>
          Перевести сотрудников
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <CreateDepartmentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreate}
      />

      {/* Edit Dialog */}
      <EditDepartmentDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedDepartment(null);
        }}
        department={selectedDepartment}
        onUpdate={handleUpdate}
      />
    </>
  );
});
