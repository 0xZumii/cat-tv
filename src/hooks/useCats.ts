import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useApi } from '../contexts/ApiContext';
import { Cat, CatWithHappiness } from '../types';
import { getHappiness } from '../lib/constants';

interface CatsState {
  cats: CatWithHappiness[];
  loading: boolean;
  error: string | null;
}

export function useCats() {
  const api = useApi();
  const [state, setState] = useState<CatsState>({
    cats: [],
    loading: true,
    error: null,
  });

  // Transform cats with happiness
  const transformCats = useCallback((cats: Cat[]): CatWithHappiness[] => {
    return cats.map(cat => ({
      ...cat,
      happiness: getHappiness(cat.lastFedAt),
    }));
  }, []);

  // Initial load
  useEffect(() => {
    const loadCats = async () => {
      try {
        const result = await api.callGetCats();
        const catsData = (result.data as { cats: Cat[] }).cats || [];
        setState({
          cats: transformCats(catsData),
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Failed to load cats:', err);
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load cats',
        }));
      }
    };

    loadCats();
  }, [api, transformCats]);

  // Realtime listener for updates
  useEffect(() => {
    const catsRef = collection(db, 'cats');
    const q = query(catsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const catsData: Cat[] = [];
      snapshot.forEach((doc) => {
        catsData.push({ id: doc.id, ...doc.data() } as Cat);
      });

      setState(prev => ({
        ...prev,
        cats: transformCats(catsData),
      }));
    }, (err) => {
      console.error('Realtime cats error:', err);
    });

    return () => unsubscribe();
  }, [transformCats]);

  // Update happiness periodically (cats get hungry over time)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        cats: prev.cats.map(cat => ({
          ...cat,
          happiness: getHappiness(cat.lastFedAt),
        })),
      }));
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, []);

  const getCatById = useCallback((id: string) => {
    return state.cats.find(cat => cat.id === id);
  }, [state.cats]);

  const happyCatsCount = state.cats.filter(cat => cat.happiness.level === 'happy').length;

  return {
    ...state,
    getCatById,
    happyCatsCount,
    totalCats: state.cats.length,
  };
}
