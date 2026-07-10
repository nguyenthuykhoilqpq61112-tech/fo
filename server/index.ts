import express, {type Request, type Response, type NextFunction} from 'express';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {openDatabase, hashPassword, verifyPassword, newId, type AppDb} from './database.ts';
import {getWorldCupLiveMatches} from './worldCup2026.ts';

type AuthedRequest = Request & { user?: { id: string; username: string } };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isBundledServer = path.basename(__dirname) === 'server' && path.basename(path.dirname(__dirname)) === 'dist';
const distDir = isBundledServer ? path.dirname(__dirname) : path.resolve(__dirname, '..', 'dist');

const app = express();
const db: AppDb = await openDatabase();
const port = Number(process.env.PORT || 3000);

app.use(express.json({limit: '5mb'}));

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({error: message});
}

async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const auth = req.header('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return sendError(res, 401, 'Missing bearer token');
  const session = await db.get<{user_id: string; username: string}>(
    `SELECT sessions.user_id, users.username
       FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ? AND sessions.expires_at > CURRENT_TIMESTAMP`,
    token,
  );
  if (!session) return sendError(res, 401, 'Invalid or expired session');
  req.user = {id: session.user_id, username: session.username};
  next();
}


async function loadGameState(userId: string, mode: string, slot: number) {
  const row = await db.get<{
    profile_json: string;
    teams_json: string;
    fixtures_json: string;
    tipsters_json: string;
    tipster_tickets_json: string;
  }>('SELECT * FROM game_states WHERE user_id = ? AND mode = ? AND slot = ?', userId, mode, slot);
  if (!row) return null;
  return {
    profile: JSON.parse(row.profile_json),
    teams: JSON.parse(row.teams_json),
    fixtures: JSON.parse(row.fixtures_json),
    tipsters: JSON.parse(row.tipsters_json),
    tipsterTickets: JSON.parse(row.tipster_tickets_json),
  };
}

async function persistLoadedGameState(userId: string, mode: string, slot: number, state: {profile: unknown; teams: unknown[]; fixtures: unknown[]; tipsters: unknown[]; tipsterTickets: unknown}) {
  await db.run(
    `INSERT INTO game_states (user_id, mode, slot, profile_json, teams_json, fixtures_json, tipsters_json, tipster_tickets_json, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, mode, slot) DO UPDATE SET
       profile_json = excluded.profile_json,
       teams_json = excluded.teams_json,
       fixtures_json = excluded.fixtures_json,
       tipsters_json = excluded.tipsters_json,
       tipster_tickets_json = excluded.tipster_tickets_json,
       updated_at = CURRENT_TIMESTAMP`,
    userId, mode, slot, JSON.stringify(state.profile), JSON.stringify(state.teams), JSON.stringify(state.fixtures), JSON.stringify(state.tipsters), JSON.stringify(state.tipsterTickets),
  );
}

function requireModeSlot(req: Request) {
  const mode = String(req.params.mode || req.body.mode || '').toUpperCase();
  const slot = Number(req.params.slot || req.body.slot);
  if (!['TOURNAMENT', 'LEAGUE'].includes(mode)) throw new Error('Mode must be TOURNAMENT or LEAGUE');
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error('Slot must be 1, 2, or 3');
  return {mode, slot};
}

app.post('/api/auth/register', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  if (username.length < 3) return sendError(res, 400, 'Username must be at least 3 characters');
  if (password.length < 8) return sendError(res, 400, 'Password must be at least 8 characters');
  try {
    const id = newId('user');
    await db.run('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', id, username, hashPassword(password));
    const token = newId('session');
    await db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))", token, id);
    res.status(201).json({token, user: {id, username}});
  } catch (err) {
    if (String(err).includes('UNIQUE')) return sendError(res, 409, 'Username is already taken');
    throw err;
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');
  const user = await db.get<{id: string; username: string; password_hash: string}>('SELECT * FROM users WHERE username = ?', username);
  if (!user || !verifyPassword(password, user.password_hash)) return sendError(res, 401, 'Invalid username or password');
  const token = newId('session');
  await db.run("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime('now', '+30 days'))", token, user.id);
  res.json({token, user: {id: user.id, username: user.username}});
});


app.get('/api/world-cup/live', async (_req, res) => {
  try {
    res.json(await getWorldCupLiveMatches());
  } catch (err) {
    sendError(res, 502, (err as Error).message || 'Unable to load World Cup live feed');
  }
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => res.json({user: req.user}));
app.post('/api/auth/logout', requireAuth, async (req, res) => {
  const token = (req.header('authorization') || '').slice(7);
  await db.run('DELETE FROM sessions WHERE token = ?', token);
  res.status(204).end();
});

app.get('/api/game-state/:mode/:slot', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {mode, slot} = requireModeSlot(req);
    const row = await db.get('SELECT * FROM game_states WHERE user_id = ? AND mode = ? AND slot = ?', req.user!.id, mode, slot);
    if (!row) return res.status(404).json({state: null});
    res.json({
      state: {
        profile: JSON.parse(row.profile_json),
        teams: JSON.parse(row.teams_json),
        fixtures: JSON.parse(row.fixtures_json),
        tipsters: JSON.parse(row.tipsters_json),
        tipsterTickets: JSON.parse(row.tipster_tickets_json),
        updatedAt: row.updated_at,
      },
    });
  } catch (err) { sendError(res, 400, (err as Error).message); }
});

app.put('/api/game-state/:mode/:slot', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {mode, slot} = requireModeSlot(req);
    const {profile, teams, fixtures, tipsters, tipsterTickets} = req.body;
    if (!profile || !Array.isArray(teams) || !Array.isArray(fixtures) || !Array.isArray(tipsters) || typeof tipsterTickets !== 'object') {
      return sendError(res, 400, 'Incomplete game state payload');
    }
    await persistLoadedGameState(req.user!.id, mode, slot, {profile, teams, fixtures, tipsters, tipsterTickets});
    res.json({ok: true});
  } catch (err) { sendError(res, 400, (err as Error).message); }
});

app.post('/api/wallet/ledger', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {mode, slot} = requireModeSlot(req);
    const amount = Number(req.body.amount);
    const reason = String(req.body.reason || 'manual');
    if (!Number.isFinite(amount) || amount === 0) return sendError(res, 400, 'Amount must be a non-zero number');
    const id = newId('ledger');
    await db.run('INSERT INTO wallet_ledger (id, user_id, mode, slot, amount, reason) VALUES (?, ?, ?, ?, ?, ?)', id, req.user!.id, mode, slot, amount, reason);
    res.status(201).json({id, amount, reason});
  } catch (err) { sendError(res, 400, (err as Error).message); }
});


app.post('/api/bets/place', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {mode, slot} = requireModeSlot(req);
    const ticket = req.body.ticket;
    if (!ticket || typeof ticket !== 'object') return sendError(res, 400, 'Missing ticket payload');
    const stake = Number(ticket.stake);
    if (!Number.isFinite(stake) || stake <= 0) return sendError(res, 400, 'Ticket stake must be greater than zero');

    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      const state = await loadGameState(req.user!.id, mode, slot);
      if (!state) throw Object.assign(new Error('Game state must be saved before placing a bet'), {status: 409});
      const profile = state.profile as {balance: number; tickets?: unknown[]};
      const balance = Number(profile.balance);
      if (!Number.isFinite(balance)) throw Object.assign(new Error('Stored profile balance is invalid'), {status: 409});
      if (balance < stake) throw Object.assign(new Error('Insufficient wallet balance'), {status: 409});

      const nextProfile = {
        ...profile,
        balance: Math.round((balance - stake) * 100) / 100,
        tickets: [...(Array.isArray(profile.tickets) ? profile.tickets : []), ticket],
      };
      await persistLoadedGameState(req.user!.id, mode, slot, {...state, profile: nextProfile});
      const betId = newId('bet');
      await db.run('INSERT INTO bet_audit (id, user_id, mode, slot, ticket_json) VALUES (?, ?, ?, ?, ?)', betId, req.user!.id, mode, slot, JSON.stringify(ticket));
      await db.run('INSERT INTO wallet_ledger (id, user_id, mode, slot, amount, reason) VALUES (?, ?, ?, ?, ?, ?)', newId('ledger'), req.user!.id, mode, slot, -stake, 'bet_stake');
      await db.exec('COMMIT');
      res.status(201).json({profile: nextProfile, betAuditId: betId});
    } catch (err) {
      await db.exec('ROLLBACK');
      const status = Number((err as {status?: number}).status || 400);
      return sendError(res, status, (err as Error).message);
    }
  } catch (err) { sendError(res, 400, (err as Error).message); }
});

app.post('/api/bets/cash-out', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {mode, slot} = requireModeSlot(req);
    const ticketId = String(req.body.ticketId || '');
    const offerAmount = Number(req.body.offerAmount);
    if (!ticketId) return sendError(res, 400, 'Missing ticketId');
    if (!Number.isFinite(offerAmount) || offerAmount <= 0) return sendError(res, 400, 'Offer amount must be greater than zero');

    await db.exec('BEGIN IMMEDIATE TRANSACTION');
    try {
      const state = await loadGameState(req.user!.id, mode, slot);
      if (!state) throw Object.assign(new Error('Game state must be saved before cash out'), {status: 409});
      const profile = state.profile as {balance: number; currentRoundIndex?: number; tickets?: Array<Record<string, unknown>>};
      const tickets = Array.isArray(profile.tickets) ? profile.tickets : [];
      const target = tickets.find((ticket) => ticket.id === ticketId);
      if (!target || target.status !== 'PENDING') throw Object.assign(new Error('Ticket is not available for cash out'), {status: 409});
      const nextProfile = {
        ...profile,
        balance: Math.round((Number(profile.balance) + offerAmount) * 100) / 100,
        tickets: tickets.map((ticket) => ticket.id === ticketId ? {
          ...ticket,
          status: 'CASHED_OUT',
          cashedOutAmount: offerAmount,
          cashedOutRound: profile.currentRoundIndex ?? 0,
        } : ticket),
      };
      await persistLoadedGameState(req.user!.id, mode, slot, {...state, profile: nextProfile});
      await db.run('INSERT INTO wallet_ledger (id, user_id, mode, slot, amount, reason) VALUES (?, ?, ?, ?, ?, ?)', newId('ledger'), req.user!.id, mode, slot, offerAmount, 'cash_out');
      await db.exec('COMMIT');
      res.json({profile: nextProfile});
    } catch (err) {
      await db.exec('ROLLBACK');
      const status = Number((err as {status?: number}).status || 400);
      return sendError(res, status, (err as Error).message);
    }
  } catch (err) { sendError(res, 400, (err as Error).message); }
});

app.post('/api/bets/audit', requireAuth, async (req: AuthedRequest, res) => {
  try {
    const {mode, slot} = requireModeSlot(req);
    if (!req.body.ticket) return sendError(res, 400, 'Missing ticket payload');
    const id = newId('bet');
    await db.run('INSERT INTO bet_audit (id, user_id, mode, slot, ticket_json) VALUES (?, ?, ?, ?, ?)', id, req.user!.id, mode, slot, JSON.stringify(req.body.ticket));
    res.status(201).json({id});
  } catch (err) { sendError(res, 400, (err as Error).message); }
});

app.use(express.static(distDir));
app.get('*', (_req, res) => res.sendFile(path.join(distDir, 'index.html')));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  sendError(res, 500, 'Internal server error');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Full-stack server listening on http://0.0.0.0:${port}`);
});
