import type { FC, ReactNode } from 'react';
import { createContext, useContext } from 'react';
import { RootStore } from '@shared/lib/store/RootStore';

const StoreContext = createContext<RootStore | null>(null);

const rootStore = new RootStore();
let hasWarnedAboutMissingProvider = false;

interface StoreProviderProps {  
  children: ReactNode;
}

export const StoreProvider: FC<StoreProviderProps> = ({ children }) => {
  return (
    <StoreContext.Provider value={rootStore}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    if (!hasWarnedAboutMissingProvider) {
      console.warn('useStore used outside StoreProvider, fallback rootStore will be used.');
      hasWarnedAboutMissingProvider = true;
    }
    return rootStore;
  }
  return context;
};
