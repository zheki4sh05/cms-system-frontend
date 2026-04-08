import { makeAutoObservable, runInAction } from 'mobx';
import { AuthApi } from '@shared/lib/api/authApi';
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

  // Проверка валидности токена
  private async validateToken() {
    try {
      const user = await AuthApi.getCurrentUser();
      runInAction(() => {
        this.user = user;
        localStorage.setItem('user', JSON.stringify(user));
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

      runInAction(() => {
        this.user = response.user;
        this.isAuthenticated = true;
        this.isLoading = false;

        // Если это НЕ первый вход - показываем профиль
        this.shouldShowProfile = !response.user.isFirstLogin;
        // Сохранение токенов и данных пользователя
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      });

      return response.user;
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

      runInAction(() => {
        this.user = response.user;
        this.isAuthenticated = true;
        this.isLoading = false;

        // При регистрации НЕ показываем профиль (будет редирект на помощь)
        this.shouldShowProfile = false;

        // Сохранение токенов и данных пользователя
        localStorage.setItem('accessToken', response.tokens.accessToken);
        localStorage.setItem('refreshToken', response.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
      });

      return response.user;
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