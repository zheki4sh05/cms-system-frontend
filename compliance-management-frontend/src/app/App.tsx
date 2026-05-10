import { RouterProvider } from '@app/providers/RouterProviders';
import { StoreProvider } from '@app/providers/StoreProvider';
import { ThemeProvider } from '@app/providers/ThemeProviders';

export const App = () => {
  return (
    <StoreProvider>
      <ThemeProvider>
        <RouterProvider />
      </ThemeProvider>
    </StoreProvider>
  );
};
