
import { makeAutoObservable } from 'mobx';
import { AuthStore } from '@features/auth/model/AuthStore';

export class RootStore {
  authStore: AuthStore;

  constructor() {
    this.authStore = new AuthStore(this);
    makeAutoObservable(this);
  }

  // Метод для сброса всех store (например, при logout)
  reset() {
    this.authStore = new AuthStore(this);
  }
}