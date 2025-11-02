import { RouterProvider } from "./providers/RouterProviders";
import { StoreProvider } from "./providers/StoreProvider";
import { ThemeProvider } from "./providers/ThemeProviders";

export const App = () => {
  return (
    <StoreProvider>
      <ThemeProvider>
        <RouterProvider />
      </ThemeProvider>
    </StoreProvider>
  );
};
