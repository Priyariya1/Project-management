import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { onUnauthorized, tokenStorage, userStorage } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => userStorage.get());
  const [initialising, setInitialising] = useState(() => Boolean(tokenStorage.get()));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!tokenStorage.get()) {
      setInitialising(false);
      return undefined;
    }

    authApi
      .me()
      .then((response) => {
        if (cancelled) return;
        setUser(response.data.user);
        userStorage.set(response.data.user);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setInitialising(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => onUnauthorized(clearSession), [clearSession]);

  const applySession = useCallback((response) => {
    tokenStorage.set(response.data.token);
    userStorage.set(response.data.user);
    setUser(response.data.user);
    return response.data.user;
  }, []);

  const login = useCallback(
    async (credentials) => applySession(await authApi.login(credentials)),
    [applySession],
  );

  const register = useCallback(
    async (payload) => applySession(await authApi.register(payload)),
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), initialising, login, register, logout }),
    [user, initialising, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an <AuthProvider>');
  }
  return context;
}
