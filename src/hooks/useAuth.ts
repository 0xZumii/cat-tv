import { useState, useEffect, useCallback } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { User } from '../types';

const API_BASE = 'https://us-central1-cattv-99bd2.cloudfunctions.net';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

async function callFunction(name: string, token: string, data: unknown = {}) {
  const response = await fetch(`${API_BASE}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ data }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const json = await response.json();
  return json.result;
}

export function useAuth() {
  const { ready, authenticated, user: privyUser, login, logout, getAccessToken } = usePrivy();

  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // Fetch user data from our backend when authenticated
  useEffect(() => {
    async function fetchUserData() {
      if (!ready) return;

      if (!authenticated || !privyUser) {
        setState({
          user: null,
          loading: false,
          error: null,
        });
        return;
      }

      setState(prev => ({ ...prev, loading: true }));

      try {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Failed to get access token');
        }

        const userData = await callFunction('getUser', token);
        setState({
          user: { ...userData, id: privyUser.id },
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('[useAuth] Failed to get user data:', err);
        setState({
          user: null,
          loading: false,
          error: 'Failed to load user data',
        });
      }
    }

    fetchUserData();
  }, [ready, authenticated, privyUser, getAccessToken]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  }, []);

  return {
    user: state.user,
    loading: !ready || state.loading,
    error: state.error,
    isAuthenticated: authenticated,
    privyUser,
    login,
    logout,
    updateUser,
    getAccessToken,
  };
}
