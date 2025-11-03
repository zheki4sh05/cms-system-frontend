
import { useStore } from '@app/providers/StoreProvider';

export const useAuthStore = () => {
  const { authStore } = useStore();
  return authStore;
};