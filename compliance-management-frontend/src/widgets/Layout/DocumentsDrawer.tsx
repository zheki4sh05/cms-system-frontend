import { type FC, useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Stack,
  Chip,
  Paper,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  UploadFileOutlined,
  InsertDriveFileOutlined,
  PictureAsPdfOutlined,
  ArticleOutlined,
  MoreVert as MoreVertIcon,
  DownloadOutlined,
  DeleteOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';

interface DocumentsDrawerProps {
  open: boolean;
  onClose: () => void;
}

// Моковые данные документов
const mockDocuments = [
  {
    id: '1',
    name: 'Регламент_закупок_2025.pdf',
    type: 'pdf',
    size: '2.4 MB',
    uploadedBy: 'Иван Менеджеров',
    uploadedAt: '2025-11-08',
    category: 'Регламенты',
  },
  {
    id: '2',
    name: 'План_корректирующих_действий.docx',
    type: 'docx',
    size: '156 KB',
    uploadedBy: 'Петр Руководителев',
    uploadedAt: '2025-11-07',
    category: 'Планы',
  },
  {
    id: '3',
    name: 'Отчет_по_инцидентам_Q4.xlsx',
    type: 'xlsx',
    size: '890 KB',
    uploadedBy: 'Анна Директорова',
    uploadedAt: '2025-11-06',
    category: 'Отчеты',
  },
  {
    id: '4',
    name: 'Инструкция_для_менеджеров.pdf',
    type: 'pdf',
    size: '1.2 MB',
    uploadedBy: 'Система',
    uploadedAt: '2025-11-01',
    category: 'Инструкции',
  },
];

export const DocumentsDrawer: FC<DocumentsDrawerProps> = ({ open, onClose }) => {
  const appProfile = import.meta.env.VITE_APP_PROFILE ?? 'dev';
  const documents = appProfile === 'test' ? [] : mockDocuments;
  const [searchQuery, setSearchQuery] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  const filteredDocuments = documents.filter(doc => 
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, docId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedDoc(docId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDoc(null);
  };

  useEffect(() => {
    if (open) {
      return;
    }
    setAnchorEl(null);
    setSelectedDoc(null);
  }, [open]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <PictureAsPdfOutlined color="error" />;
      case 'docx':
        return <ArticleOutlined color="primary" />;
      case 'xlsx':
        return <ArticleOutlined color="success" />;
      default:
        return <InsertDriveFileOutlined />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, any> = {
      'Регламенты': 'primary',
      'Планы': 'secondary',
      'Отчеты': 'warning',
      'Инструкции': 'info',
    };
    return colors[category] || 'default';
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
              Документы
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Управление документацией системы
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ p: 3 }}>
          {/* Search and Upload */}
          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <TextField
              placeholder="Поиск документов..."
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
            <Button
              variant="contained"
              startIcon={<UploadFileOutlined />}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Загрузить
            </Button>
          </Stack>

          {/* Documents List */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Найдено документов: {filteredDocuments.length}
          </Typography>

          <List sx={{ bgcolor: 'background.paper' }}>
            {filteredDocuments.map((doc) => (
              <Paper
                key={doc.id}
                variant="outlined"
                sx={{ mb: 2, overflow: 'hidden' }}
              >
                <ListItem
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      onClick={(e) => handleMenuOpen(e, doc.id)}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  }
                  sx={{
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 48 }}>
                    {getFileIcon(doc.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {doc.name}
                        </Typography>
                        <Chip
                          label={doc.category}
                          size="small"
                          color={getCategoryColor(doc.category)}
                        />
                      </Box>
                    }
                    secondary={
                      <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Размер: {doc.size} • Загрузил: {doc.uploadedBy}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Дата: {new Date(doc.uploadedAt).toLocaleDateString('ru-RU')}
                        </Typography>
                      </Stack>
                    }
                  />
                </ListItem>
              </Paper>
            ))}
          </List>

          {filteredDocuments.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Документы не найдены
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
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <VisibilityOutlined fontSize="small" />
          </ListItemIcon>
          Просмотреть
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DownloadOutlined fontSize="small" />
          </ListItemIcon>
          Скачать
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteOutlined fontSize="small" color="error" />
          </ListItemIcon>
          Удалить
        </MenuItem>
      </Menu>
    </>
  );
};