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
import { useState, type FC } from 'react';

interface DepartmentsDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Моковые данные департаментов
const mockDepartments: Department[] = [
  {
    id: 'dept-001',
    name: 'Отдел закупок №1',
    description: 'Основной отдел закупок',
    managerId: '2',
    managerName: 'Петр Руководителев',
    employeeCount: 5,
    createdAt: '2024-01-15',
    updatedAt: '2025-11-01',
  },
  {
    id: 'dept-002',
    name: 'Отдел закупок №2',
    description: 'Дополнительный отдел закупок',
    managerId: undefined,
    managerName: undefined,
    employeeCount: 3,
    createdAt: '2024-03-20',
    updatedAt: '2025-10-15',
  },
  {
    id: 'dept-003',
    name: 'Департамент стратегических закупок',
    description: 'Работа с крупными поставщиками',
    managerId: '2',
    managerName: 'Петр Руководителев',
    employeeCount: 8,
    createdAt: '2024-06-10',
    updatedAt: '2025-11-05',
  },
];

export const DepartmentsDrawer: FC<DepartmentsDrawerProps> = observer(({ open, onClose }) => {
  const authStore = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuDepartment, setMenuDepartment] = useState<Department | null>(null);

  // Только топ-менеджмент может создавать и редактировать
  const canManageDepartments = authStore.isExecutive;

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
    // TODO: API call
    console.log('Creating department:', { name, description });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name,
      description,
      employeeCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDepartments([...departments, newDept]);
  };

  const handleUpdate = async (id: string, name: string, description?: string) => {
    // TODO: API call
    console.log('Updating department:', { id, name, description });
    await new Promise(resolve => setTimeout(resolve, 1000));

    setDepartments(departments.map(dept => 
      dept.id === id 
        ? { ...dept, name, description, updatedAt: new Date().toISOString() }
        : dept
    ));
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
          {/* Search and Create */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              placeholder="Поиск департаментов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              size="small"
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
                sx={{ whiteSpace: 'nowrap' }}
              >
                Создать
              </Button>
            )}
          </Stack>

          {/* Info для не-топ-менеджмента */}
          {!canManageDepartments && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                ℹ️ Режим просмотра. Для создания и редактирования департаментов
                обратитесь к топ-менеджменту.
              </Typography>
            </Alert>
          )}

          {/* Departments List */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Найдено департаментов: {filteredDepartments.length}
          </Typography>

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

          {filteredDepartments.length === 0 && (
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