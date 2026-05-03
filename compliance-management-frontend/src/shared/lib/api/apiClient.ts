import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

class ApiClient {
  private instance: AxiosInstance;
  private readonly baseURL: string;
  private readonly authBaseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
    this.authBaseURL = this.baseURL.replace(/\/api\/v1\/?$/, '');

    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor для добавления токена
    this.instance.interceptors.request.use(
      (config) => {
        const normalizedUrl = config.url?.trim();
        const isAuthWithoutV1 = normalizedUrl === '/auth/login'
          || normalizedUrl === 'auth/login'
          || normalizedUrl === '/auth/register'
          || normalizedUrl === 'auth/register';
        const isApiWithoutV1 = normalizedUrl?.startsWith('/api/');

        if (isAuthWithoutV1) {
          config.baseURL = this.authBaseURL;
        }
        if (isApiWithoutV1) {
          config.baseURL = this.authBaseURL;
        }

        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        try {
          const userRaw = localStorage.getItem('user');
          if (userRaw) {
            const parsed = JSON.parse(userRaw) as { employeeId?: string };
            const employeeId = parsed?.employeeId?.trim();
            if (employeeId) {
              config.headers['EmployeeId'] = employeeId;
            }
          }
        } catch {
          /* игнорируем битый JSON user */
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor для обработки ошибок
    this.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Если получили 401 и это не повторный запрос
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.instance.post('/auth/refresh', {
                refreshToken,
              });

              const { accessToken } = response.data;
              localStorage.setItem('accessToken', accessToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.instance(originalRequest);
            }
          } catch (refreshError) {
            // Если обновление токена не удалось, очищаем хранилище
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public get<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.put<T>(url, data, config);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.instance.patch<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig) {
    return this.instance.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
