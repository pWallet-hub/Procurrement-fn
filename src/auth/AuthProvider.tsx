import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { setAuthLostHandler, tokenStore } from '../api/client';
import type { Session, User } from '../api/types';
import { AuthContext, type AuthContextValue } from './AuthContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(!!tokenStore.access);

  // Token refresh failed somewhere in the app -> drop the session; route guards redirect to /login.
  useEffect(() => {
    setAuthLostHandler(() => {
      setUser(null);
      qc.clear();
    });
  }, [qc]);

  // Restore session on first load.
  useEffect(() => {
    if (!tokenStore.access) return;
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const startSession = useCallback((s: Session) => {
    tokenStore.set(s.access_token, s.refresh_token);
    setUser(s.user);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async login(email, password) {
        const res = await authApi.login(email, password);
        if ('requires_totp' in res) return { kind: 'totp', challengeToken: res.challenge_token };
        startSession(res);
        return { kind: 'ok' };
      },
      async verifyTotp(challengeToken, code) {
        startSession(await authApi.totp(challengeToken, code));
      },
      async acceptInvite(token, password) {
        startSession(await authApi.acceptInvite(token, password));
      },
      async logout() {
        const refresh = tokenStore.refresh;
        try {
          if (refresh) await authApi.logout(refresh);
        } catch {
          /* ignore: we are leaving anyway */
        }
        tokenStore.clear();
        setUser(null);
        qc.clear();
      },
      async reloadUser() {
        setUser(await authApi.me());
      },
    }),
    [user, loading, startSession, qc],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
