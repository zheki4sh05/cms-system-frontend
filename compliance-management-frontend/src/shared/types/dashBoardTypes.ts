export interface DashboardStats {
  // Инциденты
  newIncidents: number;
  urgentIncidents: number;
  incidentsTrend: number; // Процент изменения за неделю
  
  // Случаи
  activeCases: number;
  closedCases: number;
  
  // Задачи
  myTasks: number;
  completedTasks: number;
  overdueTasks: number;
  
  // Производительность
  performanceScore: number; // 0-100
  avgProcessingTime: number; // В часах
}

export interface RecentActivity {
  id: string;
  type: 'INCIDENT' | 'CASE' | 'TASK' | 'NOTIFICATION';
  title: string;
  description?: string;
  timestamp: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface UpcomingTask {
  id: string;
  title: string;
  dueDate: string;
  dueIn: string; // "Сегодня", "Завтра", "2 дня"
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  isOverdue: boolean;
  caseId?: string;
}

export interface ManagerDashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  upcomingTasks: UpcomingTask[];
}