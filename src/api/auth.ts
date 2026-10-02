import { api } from './client';
import type { LoginResponse, Session, TokenPair, User } from './types';

export const authApi = {
  login: (email: string, password: string) =>
    api<LoginResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  totp: (challenge_token: string, code: string) =>
    api<Session>('/auth/totp', { method: 'POST', body: { challenge_token, code }, auth: false }),
  refresh: (refresh_token: string) =>
    api<TokenPair>('/auth/refresh', { method: 'POST', body: { refresh_token }, auth: false }),
  logout: (refresh_token: string) => api<{ ok: true }>('/auth/logout', { method: 'POST', body: { refresh_token } }),
  acceptInvite: (token: string, password: string) =>
    api<Session>('/auth/accept-invite', { method: 'POST', body: { token, password }, auth: false }),
  totpSetup: () => api<{ secret: string; otpauth_url: string }>('/auth/totp/setup', { method: 'POST' }),
  totpEnable: (code: string) => api<{ ok: true }>('/auth/totp/enable', { method: 'POST', body: { code } }),
  me: () => api<User>('/me'),
};
