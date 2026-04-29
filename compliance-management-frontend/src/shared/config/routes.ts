export const ROUTES = {
  LOGIN: '/login',
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
    INCIDENTS: '/manager/incidents',
    CASES: '/manager/cases',
    TASKS: '/manager/tasks',
    ARCHIVE: '/manager/archive',
  },
  SUPERVISOR: {
    DASHBOARD: '/supervisor/dashboard',
    CASES: '/supervisor/cases',
    INCIDENTS: '/supervisor/incidents',
    ANALYTICS: '/supervisor/analytics',
    ARCHIVE: '/supervisor/archive',
  },
  EXECUTIVE: {
    DASHBOARD: '/executive/dashboard',
    REPORTS: '/executive/reports',
    ARCHIVE: '/executive/archive',
  },
} as const;
