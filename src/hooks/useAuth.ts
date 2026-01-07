import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { signInAnon, onAuthChange, callGetUser } from '../lib/firebase';
import { User } from '../types';

interface AuthState {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    firebaseUser: null,
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[useAuth] Setting up auth listener...');
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      console.log('[useAuth] Auth state changed:', firebaseUser ? `User ${firebaseUser.uid}` : 'No user');
      if (firebaseUser) {
        setState(prev => ({ ...prev, firebaseUser, loading: true }));

        try {
          console.log('[useAuth] Calling getUser via httpsCallable...');
          const result = await callGetUser();
          console.log('[useAuth] getUser result:', result.data);
          const userData = result.data as User;
          setState({
            firebaseUser,
            user: { ...userData, id: firebaseUser.uid },
            loading: false,
            error: null,
          });
        } catch (err) {
          console.error('[useAuth] Failed to get user data:', err);
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load user data',
          }));
        }
      } else {
        // Sign in anonymously
        console.log('[useAuth] No user, attempting anonymous sign-in...');
        try {
          await signInAnon();
          console.log('[useAuth] Anonymous sign-in successful');
        } catch (err) {
          console.error('[useAuth] Anonymous sign-in failed:', err);
          setState({
            firebaseUser: null,
            user: null,
            loading: false,
            error: 'Failed to authenticate',
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const updateUser = (updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...updates } : null,
    }));
  };

  return {
    ...state,
    isAuthenticated: !!state.firebaseUser,
    updateUser,
  };
}
