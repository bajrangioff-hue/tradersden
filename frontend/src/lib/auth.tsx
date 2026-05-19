import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { UserProfile, AuthTokens } from '../types';
import { setOnUnauthorized } from './api';

interface AuthState {
  user: UserProfile | null;
  tokens: AuthTokens | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = 'bt_tokens';
const USER_KEY = 'bt_user';

function loadTokens(): AuthTokens | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function loadUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode; apiBase: string }> = ({ children, apiBase }) => {
  const [state, setState] = useState<AuthState>({
    user: loadUser(),
    tokens: loadTokens(),
    loading: false,
    error: null,
  });

  const save = useCallback((user: UserProfile | null, tokens: AuthTokens | null) => {
    setState({ user, tokens, loading: false, error: null });
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const resp = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
        setState((s) => ({ ...s, loading: false, error: body.detail || 'Login failed' }));
        throw new Error(body.detail || 'Login failed');
      }
      const tokens: AuthTokens = await resp.json();
      const meResp = await fetch(`${apiBase}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      if (!meResp.ok) {
        setState((s) => ({ ...s, loading: false, error: 'Session verification failed' }));
        throw new Error('Session verification failed');
      }
      const user: UserProfile = await meResp.json();
      save(user, tokens);
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: s.error || (err instanceof Error ? err.message : 'Network error — is the backend running?'),
      }));
      throw err;
    }
  }, [apiBase, save]);

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const resp = await fetch(`${apiBase}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, display_name: displayName }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ detail: `HTTP ${resp.status}` }));
        setState((s) => ({ ...s, loading: false, error: body.detail || 'Registration failed' }));
        throw new Error(body.detail || 'Registration failed');
      }
      await login(email, password);
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: s.error || (err instanceof Error ? err.message : 'Network error'),
      }));
      throw err;
    }
  }, [apiBase, login]);

  const logout = useCallback(() => {
    save(null, null);
  }, [save]);

  useEffect(() => {
    const tokens = loadTokens();
    if (tokens) {
      setState((s) => ({ ...s, loading: true }));
      fetch(`${apiBase}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((user) => {
          if (user) save(user, tokens);
          else save(null, null);
        })
        .catch(() => {
          setState((s) => ({ ...s, loading: false }));
          save(null, null);
        });
    }
  }, [apiBase, save]);

  useEffect(() => {
    setOnUnauthorized(() => save(null, null));
  }, [save]);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError, isAuthenticated: !!state.user }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
