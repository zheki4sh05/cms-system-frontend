
import { type FC, useState, type MouseEvent, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  InputBase,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { alpha, styled } from '@mui/material/styles';
import { useAuthStore } from '@features/auth/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { ProfileDrawer } from './../../features/profile/ui/ProfileDrawer';

// Styled компоненты для поиска
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

export const Header: FC = observer(() => {
  const authStore = useAuthStore();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenProfile = () => {
    setProfileDrawerOpen(true);
    handleMenuClose();
  };

  const handleLogout = async () => {
    await authStore.logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Search:', searchValue);
    // TODO: Implement search functionality
  };

  // Получение инициалов для аватара
  const getInitials = () => {
    const firstName = authStore.user?.firstName || '';
    const lastName = authStore.user?.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Получение названия роли на русском
  const getRoleLabel = () => {
    switch (authStore.userRole) {
      case 'MANAGER':
        return 'Менеджер по закупкам';
      case 'SUPERVISOR':
        return 'Руководитель закупок';
      case 'EXECUTIVE':
        return 'ТОП-менеджмент';
      default:
        return '';
    }
  };
  useEffect(()=>{
      if(!authStore.isFirstLogin){
          handleOpenProfile()
      }
  },[])

  return (
    <>
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{ 
          backgroundColor: 'white', 
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {/* Поиск */}
          <Search>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <form onSubmit={handleSearch}>
              <StyledInputBase
                placeholder="Поиск по системе..."
                inputProps={{ 'aria-label': 'search' }}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </form>
          </Search>

          <Box sx={{ flexGrow: 1 }} />

          {/* Правая часть */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Уведомления */}
            <Tooltip title="Уведомления">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Профиль пользователя */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                ml: 1,
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={handleMenuOpen}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                }}
              >
                {getInitials()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {authStore.fullName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                  {getRoleLabel()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Меню профиля */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              sx: { 
                mt: 1.5,
                minWidth: 220,
              },
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {authStore.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {authStore.user?.email}
              </Typography>
            </Box>

            <Divider />

            <MenuItem onClick={handleOpenProfile}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              Профиль
            </MenuItem>

            <MenuItem onClick={handleMenuClose}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Настройки
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

       {/* Profile Drawer */}
      <ProfileDrawer 
        open={profileDrawerOpen} 
        onClose={() => setProfileDrawerOpen(false)} 
      />
    </>
  );
});