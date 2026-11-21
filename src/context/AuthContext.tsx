'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.resolve().then(async () => {
      const storedToken = localStorage.getItem('hmo_token');
      if (!storedToken) {
        if (active) setIsLoading(false);
        return;
      }
      if (active) setToken(storedToken);
      try {
        const res = await getCurrentUser();
        if (active) setUser(res.data.user);
      } catch {
        localStorage.removeItem('hmo_token');
        localStorage.removeItem('hmo_user');
        if (active) setToken(null);
      } finally {
        if (active) setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  const setTokenAndUser = useCallback((newToken: string, newUser: AuthUser) => {
    queryClient.clear();
    localStorage.setItem('hmo_token', newToken);
    localStorage.setItem('hmo_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, [queryClient]);

  const clearAuth = useCallback(() => {
    queryClient.clear();
    localStorage.removeItem('hmo_token');
    localStorage.removeItem('hmo_user');
    setToken(null);
    setUser(null);
  }, [queryClient]);

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
