import { createContext, useCallback, useContext, useState } from 'react';
import { api } from '../api';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(readStoredUser);

  const persist = useCallback((nextToken, nextUser) => {
    if (nextToken) {
      localStorage.setItem('token', nextToken);
    } else {
      localStorage.removeItem('token');
    }
    if (nextUser) {
      localStorage.setItem('user', JSON.stringify(nextUser));
    } else {
      localStorage.removeItem('user');
    }
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const data = await api.login(email, password);
      persist(data.token, data.user);
      return data;
    },
    [persist],
  );

  const signup = useCallback(
    async (name, email, password) => {
      const data = await api.signup(name, email, password);
      persist(data.token, data.user);
      return data;
    },
    [persist],
  );

  const logout = useCallback(() => {
    persist(null, null);
  }, [persist]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
