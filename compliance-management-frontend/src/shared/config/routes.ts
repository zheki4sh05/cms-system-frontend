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
    INCIDENTS_CASES: '/supervisor/incidents-cases',
    ARCHIVE: '/supervisor/archive',
  },
  EXECUTIVE: {
    DASHBOARD: '/executive/dashboard',
    INCIDENTS_CASES: '/executive/incidents-cases',
    ARCHIVE: '/executive/archive',
  },
} as const;
