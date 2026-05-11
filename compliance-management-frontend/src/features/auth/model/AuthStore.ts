import { makeAutoObservable, runInAction } from 'mobx';
import { AuthApi, type UserMeResponse } from '@shared/lib/api/authApi';
import { DepartmentApi } from '@shared/lib/api/departmentApi';
import { type User, type LoginCredentials, type RegisterCredentials } from '@shared/types/customTypes';
import { UserRoleValues } from '@shared/types/customTypes';
export class AuthStore {
  user: User | null = null;
  isAuthenticated: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  shouldShowProfile: boolean = false;  // Флаг для показа профиля при входе

  constructor(private rootStore?: any) {
    makeAutoObservable(this, {}, { autoBind: true });
    this.initAuth();
  }

  // Инициализация - проверка наличия токена при загрузке приложения
  private initAuth() {
    const token = localStorage.getItem('accessToken');
    const userJson = localStorage.getItem('user');

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson);
        runInAction(() => {
          this.user = user;
          this.isAuthenticated = true;
        });

        // Дополнительная проверка валидности токена
        this.validateToken();
      } catch (error) {
        console.error('Failed to parse user data:', error);
        this.logout();
      }
    }
  }

  /** Слияние полей из GET /api/users/me (в т.ч. employeeInternal) */
  private mergeUserWithMeProfile(user: User, profile: UserMeResponse): User {
    const internal = profile.employeeInternal;
    const hasInternal = internal != null && typeof internal === 'object';

    const departmentId = hasInternal
      ? internal.departmentId || user.departmentId
      : profile.departmentId ?? user.departmentId;

    const departmentName = hasInternal
      ? internal.departmentName || user.departmentName
      : user.departmentName;

    const employeeId = hasInternal
      ? profile.employeeId ?? internal.employeeId ?? user.employeeId
      : profile.employeeId ?? user.employeeId;

    return {
      ...user,
      firstName: profile.firstName || user.firstName,
      lastName: profile.lastName || user.lastName,
      email: profile.email || user.email,
      role: profile.role as User['role'],
      companyId: profile.companyId || user.companyId,
      employeeId,
      departmentId,
      departmentName,
      hasAdminAccess: profile.hasAdminAccess ?? user.hasAdminAccess,
    };
  }

  /** Дополняет name отдела через GET /departments/{id}, если имя ещё не известно */
  private async enrichUserWithDepartment(user: User): Promise<User> {
    if (!user.departmentId) {
      return user;
    }
    if (user.departmentName) {
      return user;
    }
    try {
      const department = await DepartmentApi.getDepartment(user.departmentId);
      return {
        ...user,
        departmentId: department.id,
        departmentName: department.name,
      };
    } catch (error) {
      console.error('Failed to load department:', error);
      return user;
    }
  }

  // Проверка валидности токена
  private async validateToken() {
    try {
      let user = await AuthApi.getCurrentUser();
      try {
        const profile = await AuthApi.getUserMe();
        user = this.mergeUserWithMeProfile(user, profile);
      } catch (profileError) {
        console.error('Failed to load /api/users/me during token validation:', profileError);
      }
      const enriched = await this.enrichUserWithDepartment(user);
      runInAction(() => {
        this.user = enriched;
        localStorage.setItem('user', JSON.stringify(enriched));
      });
    } catch (error) {
      console.error('Token validation failed:', error);
      this.logout();
    }
  }

  // Вход в систему
  async login(credentials: LoginCredentials) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await AuthApi.login(credentials);

      // Сохраняем токены до запросов к защищенным endpoint'ам
      localStorage.setItem('accessToken', response.tokens.accessToken);
      localStorage.setItem('refreshToken', response.tokens.refreshToken);

      let userData = response.user;

      try {
        const profile = await AuthApi.getUserMe();
        userData = this.mergeUserWithMeProfile(userData, profile);
      } catch (profileError) {
        console.error('Failed to load /api/users/me profile:', profileError);
      }

      userData = await this.enrichUserWithDepartment(userData);

      runInAction(() => {
        this.user = userData;
        this.isAuthenticated = true;
        this.isLoading = false;

        // Если это НЕ первый вход - показываем профиль
        this.shouldShowProfile = !userData.isFirstLogin;
        // Сохранение данных пользователя
        localStorage.setItem('user', JSON.stringify(userData));
      });

      return userData;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка входа в систему';
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Регистрация нового пользователя
  async register(credentials: RegisterCredentials) {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await AuthApi.register(credentials);

      const userWithDepartment = await this.enrichUserWithDepartment(response.user);

      runInAction(() => {
        this.user = userWithDepartment;
        this.isAuthenticated = true;
        this.isLoading = false;

        // При регистрации НЕ показываем профиль (будет редирект на помощь)
        this.shouldShowProfile = false;

        // Сохранение токенов и данных пользователя
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userWithDepartment));
      });

      return userWithDepartment;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.response?.data?.message || 'Ошибка регистрации';
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Отметить, что пользователь больше не новичок
  markAsReturningUser() {
    if (this.user) {
      const updatedUser = { ...this.user, isFirstLogin: false };
      this.user = updatedUser;
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  // Сбросить флаг показа профиля
  resetShowProfile() {
    this.shouldShowProfile = false;
  }

  // Выход из системы
  async logout() {
    try {
      await AuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      runInAction(() => {
        this.user = null;
        this.isAuthenticated = false;
        this.error = null;
        this.shouldShowProfile = false;

        // Очистка локального хранилища
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      });
    }
  }

  // Получение роли пользователя
  get userRole(): string | null {
    return this.user?.role || null;
  }

  // Проверка роли
  hasRole(role: string): boolean {
    return this.userRole === role;
  }

  // Проверка доступа для менеджера
  get isManager(): boolean {
    return this.hasRole(UserRoleValues.MANAGER);
  }

  // Проверка доступа для руководителя
  get isSupervisor(): boolean {
    return this.hasRole(UserRoleValues.SUPERVISOR);
  }

  // Проверка доступа для топ-менеджмента
  get isExecutive(): boolean {
    return this.hasRole(UserRoleValues.EXECUTIVE);
  }

  // Получение полного имени пользователя
  get fullName(): string {
    if (!this.user) return '';
    return `${this.user.firstName} ${this.user.lastName}`;
  }

  // Проверка первого входа
  get isFirstLogin(): boolean {
    return this.user?.isFirstLogin ?? false;
  }

  // Очистка ошибки
  clearError() {
    this.error = null;
  }
}