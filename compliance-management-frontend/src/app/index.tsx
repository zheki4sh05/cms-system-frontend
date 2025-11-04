import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Функция для инициализации приложения
async function enableMocking() {
  // Проверяем, нужно ли включать моки
  const shouldUseMocks = import.meta.env.VITE_USE_MOCKS === 'true';

  if (!shouldUseMocks) {
    console.log('🌐 [App] Using real API');
    return;
  }

  // Динамический импорт MSW только если моки включены
  const { startWorker } = await import('./../mocks/browser');

  return startWorker();
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});