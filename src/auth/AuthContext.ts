import { createContext, useContext } from 'react';
import type { User } from '../api/types';

export type LoginResult = { kind: 'ok' } | { kind: 'totp'; challengeToken: string };

export interface AuthContextValue {
  user: User | null;
  /** true while the stored token is being validated on first load */
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTotp: (challengeToken: string, code: string) => Promise<void>;
  acceptInvite: (token: string, password: string) => Promise<void>;
  /** Trade the one-time code from an AFS sign-in for a session. */
  completeSso: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
