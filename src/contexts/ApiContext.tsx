import { createContext, useContext, useMemo, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createApiCaller } from '../lib/firebase';

type ApiCaller = ReturnType<typeof createApiCaller>;

const ApiContext = createContext<ApiCaller | null>(null);

interface ApiProviderProps {
  children: ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const { getAccessToken } = usePrivy();

  const api = useMemo(() => createApiCaller(getAccessToken), [getAccessToken]);

  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
