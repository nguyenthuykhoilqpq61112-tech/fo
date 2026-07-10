import {Fixture, Profile, Team, Tipster, BetTicket} from '../types';

const TOKEN_KEY = 'fs_auth_token';
const USER_KEY = 'fs_auth_user';

export interface AuthUser { id: string; username: string }
export interface AuthSession { token: string; user: AuthUser }
export interface PersistedGameState {
  profile: Profile;
  teams: Team[];
  fixtures: Fixture[];
  tipsters: Tipster[];
  tipsterTickets: {[id: string]: BetTicket};
  updatedAt?: string;
}

export function getStoredSession(): AuthSession | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);
  if (!token || !rawUser) return null;
  try { return {token, user: JSON.parse(rawUser)}; } catch { return null; }
}

export function storeSession(session: AuthSession) {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const session = getStoredSession();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (session) headers.set('Authorization', `Bearer ${session.token}`);
  const res = await fetch(path, {...init, headers});
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export async function register(username: string, password: string) {
  return api<AuthSession>('/api/auth/register', {method: 'POST', body: JSON.stringify({username, password})});
}

export async function login(username: string, password: string) {
  return api<AuthSession>('/api/auth/login', {method: 'POST', body: JSON.stringify({username, password})});
}

export async function fetchGameState(mode: 'TOURNAMENT' | 'LEAGUE', slot: number) {
  return api<{state: PersistedGameState | null}>(`/api/game-state/${mode}/${slot}`);
}

export async function saveGameState(mode: 'TOURNAMENT' | 'LEAGUE', slot: number, state: PersistedGameState) {
  return api<{ok: true}>(`/api/game-state/${mode}/${slot}`, {method: 'PUT', body: JSON.stringify(state)});
}

export async function recordWalletLedger(mode: 'TOURNAMENT' | 'LEAGUE', slot: number, amount: number, reason: string) {
  return api<{id: string}>(`/api/wallet/ledger`, {method: 'POST', body: JSON.stringify({mode, slot, amount, reason})});
}

export async function placeBetOnServer(mode: 'TOURNAMENT' | 'LEAGUE', slot: number, ticket: BetTicket) {
  return api<{profile: Profile; betAuditId: string}>(`/api/bets/place`, {method: 'POST', body: JSON.stringify({mode, slot, ticket})});
}

export async function cashOutOnServer(mode: 'TOURNAMENT' | 'LEAGUE', slot: number, ticketId: string, offerAmount: number) {
  return api<{profile: Profile}>(`/api/bets/cash-out`, {method: 'POST', body: JSON.stringify({mode, slot, ticketId, offerAmount})});
}

export async function auditBet(mode: 'TOURNAMENT' | 'LEAGUE', slot: number, ticket: BetTicket) {
  return api<{id: string}>(`/api/bets/audit`, {method: 'POST', body: JSON.stringify({mode, slot, ticket})});
}
