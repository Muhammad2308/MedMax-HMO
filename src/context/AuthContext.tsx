'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '@/api/auth';
import { getCurrentUser } from '@/api/auth';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setTokenAndUser: (token: string, user: AuthUser) => void;
  clearAuth: () => void;
  hasOrgPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  setTokenAndUser: () => {},
  clearAuth: () => {},
  hasOrgPermission: () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('hmo_token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    getCurrentUser()
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem('hmo_token');
        localStorage.removeItem('hmo_user');
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const setTokenAndUser = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem('hmo_token', newToken);
    localStorage.setItem('hmo_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem('hmo_token');
    localStorage.removeItem('hmo_user');
    setToken(null);
    setUser(null);
  }, []);

  const hasOrgPermission = useCallback(
    (permission: string): boolean => {
      if (!user) return false;
      if (user.is_org_admin) return true;
      return user.roles.some((role) =>
        role.permissions?.some((p) => p.title === permission)
      );
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, setTokenAndUser, clearAuth, hasOrgPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
