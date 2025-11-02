export const ROUTES = {
  LOGIN: '/login',
  MANAGER: {
    DASHBOARD: '/manager/dashboard',
    INCIDENTS: '/manager/incidents',
    CASES: '/manager/cases',
    TASKS: '/manager/tasks',
  },
  SUPERVISOR: {
    DASHBOARD: '/supervisor/dashboard',
    CASES: '/supervisor/cases',
    INCIDENTS: '/supervisor/incidents',
    ANALYTICS: '/supervisor/analytics',
  },
  EXECUTIVE: {
    DASHBOARD: '/executive/dashboard',
    REPORTS: '/executive/reports',
  },
} as const;
