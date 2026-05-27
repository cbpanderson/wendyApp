import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { tokenStorage } from '../api/client';
import { login as loginApi } from '../api/auth';
import type { AuthResponse, UserResponse } from '../api/auth';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  loginWithResponse: (res: AuthResponse) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: UserResponse) => void;
}

const AuthContext = createContext<AuthState | null>(null);

const USER_KEY = 'wendyapp.user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(() => {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as UserResponse;
    } catch {
      return null;
    }
  });

  // Keep storage in sync
  useEffect(() => {
    if (user) sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    else sessionStorage.removeItem(USER_KEY);
  }, [user]);

  const loginWithResponse = (res: AuthResponse) => {
    tokenStorage.set({ token: res.token, expiresAt: res.expiresAt });
    setUser(res.user);
  };

  const login = async (email: string, password: string) => {
    const res = await loginApi({ email, password });
    loginWithResponse(res);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        loginWithResponse,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
