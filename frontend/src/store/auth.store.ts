import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Role = 'CONSUMER' | 'COLLECTOR' | 'HUB_MANAGER' | 'RECYCLER' | 'ADMIN';

export interface UserProfile {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  role: Role;
  isVerified: boolean;
  status: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserProfile, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'ecotrace-auth',
    }
  )
);
