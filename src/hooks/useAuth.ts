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
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setState(prev => ({ ...prev, firebaseUser, loading: true }));
        
        try {
          const result = await callGetUser();
          const userData = result.data as User;
          setState({
            firebaseUser,
            user: { ...userData, id: firebaseUser.uid },
            loading: false,
            error: null,
          });
        } catch (err) {
          console.error('Failed to get user data:', err);
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Failed to load user data',
          }));
        }
      } else {
        // Sign in anonymously
        try {
          await signInAnon();
        } catch (err) {
          console.error('Auth error:', err);
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
