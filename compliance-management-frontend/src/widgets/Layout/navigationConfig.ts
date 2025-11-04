
import type { UserRole } from '@shared/types/customTypes';
import  { UserRoleValues } from '@shared/types/customTypes';
import {
  DashboardOutlined,
  ReportProblemOutlined,
  FolderOpenOutlined,
  AssignmentOutlined,
  AnalyticsOutlined,
  RuleOutlined,
  DescriptionOutlined,
  BusinessOutlined,
} from '@mui/icons-material';
import type { SvgIconTypeMap } from '@mui/material';
import type { OverridableComponent } from '@mui/material/OverridableComponent';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: OverridableComponent<SvgIconTypeMap>;
  roles: string[];
  badge?: number; // Для отображения количества (например, новых инцидентов)
}

// Конфигурация навигации для всех ролей
export const navigationItems: NavigationItem[] = [
  // ========== МЕНЕДЖЕР ==========
  {
    id: 'manager-dashboard',
    label: 'Главная панель',
    path: '/manager/dashboard',
    icon: DashboardOutlined,
    roles: [UserRoleValues.MANAGER],
  },
  {
    id: 'manager-incidents',
    label: 'Инциденты',
    path: '/manager/incidents',
    icon: ReportProblemOutlined,
    roles: [UserRoleValues.MANAGER],
  },
  {
    id: 'manager-cases',
    label: 'Случаи',
    path: '/manager/cases',
    icon: FolderOpenOutlined,
    roles: [UserRoleValues.MANAGER],
  },
  {
    id: 'manager-tasks',
    label: 'Мои задачи',
    path: '/manager/tasks',
    icon: AssignmentOutlined,
    roles: [UserRoleValues.MANAGER],
  },

  // ========== РУКОВОДИТЕЛЬ ==========
  {
    id: 'supervisor-dashboard',
    label: 'Главная панель',
    path: '/supervisor/dashboard',
    icon: DashboardOutlined,
    roles: [UserRoleValues.SUPERVISOR],
  },
  {
    id: 'supervisor-cases',
    label: 'Случаи',
    path: '/supervisor/cases',
    icon: FolderOpenOutlined,
    roles: [UserRoleValues.SUPERVISOR],
  },
  {
    id: 'supervisor-incidents',
    label: 'Инциденты',
    path: '/supervisor/incidents',
    icon: ReportProblemOutlined,
    roles: [UserRoleValues.SUPERVISOR],
  },
  {
    id: 'supervisor-analytics',
    label: 'Аналитика',
    path: '/supervisor/analytics',
    icon: AnalyticsOutlined,
    roles: [UserRoleValues.SUPERVISOR],
  },
  {
    id: 'supervisor-rules',
    label: 'Правила',
    path: '/supervisor/rules',
    icon: RuleOutlined,
    roles: [UserRoleValues.SUPERVISOR],
  },

  // ========== ТОП-МЕНЕДЖМЕНТ ==========
  {
    id: 'executive-dashboard',
    label: 'Стратегическая панель',
    path: '/executive/dashboard',
    icon: BusinessOutlined,
    roles: [UserRoleValues.EXECUTIVE],
  },
  {
    id: 'executive-reports',
    label: 'Отчеты',
    path: '/executive/reports',
    icon: DescriptionOutlined,
    roles: [UserRoleValues.EXECUTIVE],
  },
];

// Функция для получения элементов навигации по роли
export const getNavigationByRole = (role: UserRole | null): NavigationItem[] => {
  if (!role) return [];
  return navigationItems.filter(item => item.roles.includes(role));
};