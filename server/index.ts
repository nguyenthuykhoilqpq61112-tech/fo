import {getWorldCupLiveMatches} from './worldCup2026.ts';
import {staticAssets} from './staticManifest.ts';

type User = {id: string; username: string; passwordHash: string};
type Session = {userId: string; username: string; expiresAt: number};
type GameState = {
  profile: Record<string, unknown>;
  teams: unknown[];
  fixtures: unknown[];
  tipsters: unknown[];
  tipsterTickets: Record<string, unknown>;
  updatedAt?: string;
};
type Authed = {id: string; username: string};

const usersByUsername = new Map<string, User>();
const sessions = new Map<string, Session>();
const gameStates = new Map<string, GameState>();
const walletLedger: unknown[] = [];
const betAudit: unknown[] = [];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {'content-type': 'application/json; charset=utf-8'},
  });
}

function empty(status = 204) {
  return new Response(null, {status});
}

function sendError(status: number, message: string) {
  return json({error: message}, status);
}

function newId(prefix: string) {
  return `${prefix}_${globalThis.crypto.randomUUID()}`;
}

async function hashPassword(password: string, salt = newId('salt')) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const hash = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hash}`;
}

async function verifyPassword(password: string, stored: string) {
  const salt = stored.split(':')[0];
  return (await hashPassword(password, salt)) === stored;
}

function stateKey(userId: string, mode: string, slot: number) {
  return `${userId}:${mode}:${slot}`;
}

function requireModeSlot(params: Record<string, string>, body: Record<string, unknown> = {}) {
  const mode = String(params.mode || body.mode || '').toUpperCase();
  const slot = Number(params.slot || body.slot);
  if (!['TOURNAMENT', 'LEAGUE'].includes(mode)) throw new Error('Mode must be TOURNAMENT or LEAGUE');
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error('Slot must be 1, 2, or 3');
  return {mode, slot};
}

async function readBody(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') return {};
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
}

function route(pathname: string, pattern: RegExp) {
  const match = pathname.match(pattern);
  return match?.groups || null;
}

function requireAuth(request: Request): Authed | Response {
  const auth = request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return sendError(401, 'Missing bearer token');
  const session = sessions.get(token);
  if (!session || session.expiresAt <= Date.now()) return sendError(401, 'Invalid or expired session');
  return {id: session.userId, username: session.username};
}

async function handleApi(request: Request, url: URL) {
  const body = await readBody(request) as Record<string, unknown>;

  if (url.pathname === '/api/auth/register' && request.method === 'POST') {
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    if (username.length < 3) return sendError(400, 'Username must be at least 3 characters');
    if (password.length < 8) return sendError(400, 'Password must be at least 8 characters');
    if (usersByUsername.has(username)) return sendError(409, 'Username is already taken');
    const user = {id: newId('user'), username, passwordHash: await hashPassword(password)};
    usersByUsername.set(username, user);
    const token = newId('session');
    sessions.set(token, {userId: user.id, username, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000});
    return json({token, user: {id: user.id, username}}, 201);
  }

  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const user = usersByUsername.get(username);
    if (!user || !(await verifyPassword(password, user.passwordHash))) return sendError(401, 'Invalid username or password');
    const token = newId('session');
    sessions.set(token, {userId: user.id, username, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000});
    return json({token, user: {id: user.id, username}});
  }

  if (url.pathname === '/api/world-cup/live' && request.method === 'GET') {
    try {
      return json(await getWorldCupLiveMatches());
    } catch (error) {
      return sendError(502, (error as Error).message || 'Unable to load World Cup live feed');
    }
  }

  const authed = requireAuth(request);
  if (authed instanceof Response) return authed;

  if (url.pathname === '/api/auth/me' && request.method === 'GET') return json({user: authed});
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    const token = (request.headers.get('authorization') || '').slice(7);
    sessions.delete(token);
    return empty();
  }

  const gameStateParams = route(url.pathname, /^\/api\/game-state\/(?<mode>[^/]+)\/(?<slot>[^/]+)$/);
  if (gameStateParams && request.method === 'GET') {
    try {
      const {mode, slot} = requireModeSlot(gameStateParams);
      const state = gameStates.get(stateKey(authed.id, mode, slot));
      return state ? json({state}) : json({state: null}, 404);
    } catch (error) {
      return sendError(400, (error as Error).message);
    }
  }

  if (gameStateParams && request.method === 'PUT') {
    try {
      const {mode, slot} = requireModeSlot(gameStateParams);
      const {profile, teams, fixtures, tipsters, tipsterTickets} = body;
      if (!profile || !Array.isArray(teams) || !Array.isArray(fixtures) || !Array.isArray(tipsters) || typeof tipsterTickets !== 'object') {
        return sendError(400, 'Incomplete game state payload');
      }
      gameStates.set(stateKey(authed.id, mode, slot), {
        profile: profile as Record<string, unknown>,
        teams,
        fixtures,
        tipsters,
        tipsterTickets: tipsterTickets as Record<string, unknown>,
        updatedAt: new Date().toISOString(),
      });
      return json({ok: true});
    } catch (error) {
      return sendError(400, (error as Error).message);
    }
  }

  if (url.pathname === '/api/wallet/ledger' && request.method === 'POST') {
    try {
      const {mode, slot} = requireModeSlot({}, body);
      const amount = Number(body.amount);
      const reason = String(body.reason || 'manual');
      if (!Number.isFinite(amount) || amount === 0) return sendError(400, 'Amount must be a non-zero number');
      const id = newId('ledger');
      walletLedger.push({id, userId: authed.id, mode, slot, amount, reason, createdAt: new Date().toISOString()});
      return json({id, amount, reason}, 201);
    } catch (error) {
      return sendError(400, (error as Error).message);
    }
  }

  if (url.pathname === '/api/bets/place' && request.method === 'POST') {
    try {
      const {mode, slot} = requireModeSlot({}, body);
      const ticket = body.ticket as Record<string, unknown> | undefined;
      if (!ticket || typeof ticket !== 'object') return sendError(400, 'Missing ticket payload');
      const stake = Number(ticket.stake);
      if (!Number.isFinite(stake) || stake <= 0) return sendError(400, 'Ticket stake must be greater than zero');
      const key = stateKey(authed.id, mode, slot);
      const state = gameStates.get(key);
      if (!state) return sendError(409, 'Game state must be saved before placing a bet');
      const balance = Number(state.profile.balance);
      if (!Number.isFinite(balance)) return sendError(409, 'Stored profile balance is invalid');
      if (balance < stake) return sendError(409, 'Insufficient wallet balance');
      const nextProfile = {
        ...state.profile,
        balance: Math.round((balance - stake) * 100) / 100,
        tickets: [...(Array.isArray(state.profile.tickets) ? state.profile.tickets : []), ticket],
      };
      gameStates.set(key, {...state, profile: nextProfile, updatedAt: new Date().toISOString()});
      const betAuditId = newId('bet');
      betAudit.push({id: betAuditId, userId: authed.id, mode, slot, ticket, createdAt: new Date().toISOString()});
      walletLedger.push({id: newId('ledger'), userId: authed.id, mode, slot, amount: -stake, reason: 'bet_stake'});
      return json({profile: nextProfile, betAuditId}, 201);
    } catch (error) {
      return sendError(400, (error as Error).message);
    }
  }

  if (url.pathname === '/api/bets/cash-out' && request.method === 'POST') {
    try {
      const {mode, slot} = requireModeSlot({}, body);
      const ticketId = String(body.ticketId || '');
      const offerAmount = Number(body.offerAmount);
      if (!ticketId) return sendError(400, 'Missing ticketId');
      if (!Number.isFinite(offerAmount) || offerAmount <= 0) return sendError(400, 'Offer amount must be greater than zero');
      const key = stateKey(authed.id, mode, slot);
      const state = gameStates.get(key);
      if (!state) return sendError(409, 'Game state must be saved before cash out');
      const tickets = Array.isArray(state.profile.tickets) ? state.profile.tickets as Array<Record<string, unknown>> : [];
      const target = tickets.find((ticket) => ticket.id === ticketId);
      if (!target || target.status !== 'PENDING') return sendError(409, 'Ticket is not available for cash out');
      const nextProfile = {
        ...state.profile,
        balance: Math.round((Number(state.profile.balance) + offerAmount) * 100) / 100,
        tickets: tickets.map((ticket) => ticket.id === ticketId ? {
          ...ticket,
          status: 'CASHED_OUT',
          cashedOutAmount: offerAmount,
          cashedOutRound: state.profile.currentRoundIndex ?? 0,
        } : ticket),
      };
      gameStates.set(key, {...state, profile: nextProfile, updatedAt: new Date().toISOString()});
      walletLedger.push({id: newId('ledger'), userId: authed.id, mode, slot, amount: offerAmount, reason: 'cash_out'});
      return json({profile: nextProfile});
    } catch (error) {
      return sendError(400, (error as Error).message);
    }
  }

  if (url.pathname === '/api/bets/audit' && request.method === 'POST') {
    try {
      const {mode, slot} = requireModeSlot({}, body);
      if (!body.ticket) return sendError(400, 'Missing ticket payload');
      const id = newId('bet');
      betAudit.push({id, userId: authed.id, mode, slot, ticket: body.ticket, createdAt: new Date().toISOString()});
      return json({id}, 201);
    } catch (error) {
      return sendError(400, (error as Error).message);
    }
  }

  return sendError(404, 'Not found');
}

async function serveLocalStatic(url: URL) {
  const pathname = url.pathname === '/' ? '/' : url.pathname;
  const asset = staticAssets[pathname] || staticAssets['/index.html'];
  if (asset) {
    const body = asset.encoding === 'base64'
      ? Uint8Array.from(atob(asset.body), (char) => char.charCodeAt(0))
      : asset.body;
    return new Response(body, {headers: {'content-type': asset.contentType}});
  }

  const [{readFile}, path, {fileURLToPath}] = await Promise.all([
    import('node:fs/promises'),
    import('node:path'),
    import('node:url'),
  ]);
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.basename(__dirname) === 'server' && path.basename(path.dirname(__dirname)) === 'dist'
    ? path.dirname(__dirname)
    : path.resolve(__dirname, '..', 'dist');
  const safePath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  const filePath = path.resolve(distDir, safePath);
  const target = filePath.startsWith(distDir) ? filePath : path.join(distDir, 'index.html');
  try {
    const data = await readFile(target);
    return new Response(data, {headers: {'content-type': contentType(target)}});
  } catch {
    const html = await readFile(path.join(distDir, 'index.html'));
    return new Response(html, {headers: {'content-type': 'text/html; charset=utf-8'}});
  }
}

function contentType(filePath: string) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  if (filePath.endsWith('.png')) return 'image/png';
  return 'application/octet-stream';
}

export async function fetch(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.startsWith('/api/')) return handleApi(request, url);
  return serveLocalStatic(url);
}

export default {fetch};

if (typeof process !== 'undefined' && process.argv?.[1]?.endsWith('/server/index.ts')) {
  const {createServer} = await import('node:http');
  const port = Number(process.env.PORT || 3000);
  createServer(async (req, res) => {
    const request = new Request(`http://${req.headers.host || `127.0.0.1:${port}`}${req.url || '/'}`, {
      method: req.method,
      headers: req.headers as HeadersInit,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : req,
      duplex: 'half',
    } as unknown as RequestInit);
    const response = await fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  }).listen(port, '0.0.0.0', () => {
    console.log(`Full-stack server listening on http://0.0.0.0:${port}`);
  });
}
