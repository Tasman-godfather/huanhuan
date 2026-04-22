import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: string;
  nickname: string;
  avatar?: string;
  role: 'merchant' | 'admin';
  phone?: string;
  email?: string;
  companyName?: string;
  huanbeiBalance?: number;
  depositAmount?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  setAuth: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
  fetchProfile: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/user/profile');
      set({ user: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
