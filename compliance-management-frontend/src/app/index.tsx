import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

// Функция для инициализации приложения
async function enableMocking() {
  // В профиле dev используем моки, в test — реальные запросы
  const appProfile = import.meta.env.VITE_APP_PROFILE ?? 'dev';
  const shouldUseMocks = appProfile === 'dev';

  if (!shouldUseMocks) {
    console.log(`🌐 [App] Using real API (profile: ${appProfile})`);
    return;
  }

  // Динамический импорт MSW только если моки включены
  const { startWorker } = await import('./../mocks/browser');

  console.log(`🎭 [App] Using mocked API (profile: ${appProfile})`);
  return startWorker();
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});