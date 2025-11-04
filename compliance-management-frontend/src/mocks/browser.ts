
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Создаем worker с обработчиками
export const worker = setupWorker(...handlers);

// Функция для запуска worker
export const startWorker = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  await worker.start({
    onUnhandledRequest: 'bypass', // Пропускать необработанные запросы
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  });

  console.log('🎭 [MSW] Mocking enabled');
};