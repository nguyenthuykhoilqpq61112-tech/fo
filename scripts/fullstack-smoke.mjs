import {spawn} from 'node:child_process';
import {mkdir, rm, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const port = Number(process.env.SMOKE_PORT || 31337);
const baseUrl = `http://127.0.0.1:${port}`;
const tmpDir = path.join(root, 'tmp');
const dbPath = path.join(tmpDir, 'fullstack-smoke.sqlite');
const serverLogPath = path.join(tmpDir, 'fullstack-smoke-server.log');
const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30_000);

function log(message) {
  console.log(`[fullstack-smoke] ${message}`);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    log(`running: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
    child.on('error', reject);
  });
}

async function request(pathname, init = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      ...(init.body ? {'content-type': 'application/json'} : {}),
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${init.method || 'GET'} ${pathname} failed with ${response.status}: ${text}`);
  }
  if (!text) return undefined;
  const contentType = response.headers.get('content-type') || '';
  return contentType.includes('application/json') ? JSON.parse(text) : text;
}

async function waitForFrontend() {
  const startedAt = Date.now();
  let lastError = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const html = await request('/');
      if (typeof html === 'string' && html.includes('<div id="root"></div>') && html.includes('/assets/')) {
        log('frontend HTML is being served');
        return;
      }
      lastError = new Error('frontend HTML did not include expected root/assets markers');
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw lastError || new Error('frontend did not become ready');
}

function startServer() {
  log(`starting server on port ${port}`);
  const out = spawn(process.execPath, ['--enable-source-maps', '--import', 'tsx', 'server/index.ts'], {
    cwd: root,
    env: {
      ...process.env,
      PORT: String(port),
      DATABASE_URL: `sqlite:${dbPath}`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });
  const chunks = [];
  out.stdout.on('data', (chunk) => {
    chunks.push(chunk);
    process.stdout.write(chunk);
  });
  out.stderr.on('data', (chunk) => {
    chunks.push(chunk);
    process.stderr.write(chunk);
  });
  return {
    process: out,
    async stop() {
      if (out.exitCode === null) out.kill('SIGTERM');
      await Promise.race([
        new Promise((resolve) => out.once('exit', resolve)),
        new Promise((resolve) => setTimeout(resolve, 2_000)),
      ]);
      if (out.exitCode === null) out.kill('SIGKILL');
      await mkdir(tmpDir, {recursive: true});
      await writeFile(serverLogPath, Buffer.concat(chunks));
    },
  };
}

async function assertApiLoop() {
  const username = `loop_${Date.now()}`;
  const registered = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({username, password: 'password123'}),
  });
  if (!registered.token || registered.user.username !== username) throw new Error('register did not return expected session');
  const auth = {authorization: `Bearer ${registered.token}`};

  const me = await request('/api/auth/me', {headers: auth});
  if (me.user.username !== username) throw new Error('/api/auth/me returned wrong user');

  const initialState = {
    profile: {username, balance: 100, tickets: [], currentRoundIndex: 0, netProfit: 0, createdTime: 1},
    teams: [],
    fixtures: [],
    tipsters: [],
    tipsterTickets: {},
  };
  await request('/api/game-state/TOURNAMENT/1', {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify(initialState),
  });
  const saved = await request('/api/game-state/TOURNAMENT/1', {headers: auth});
  if (saved.state.profile.balance !== 100) throw new Error('saved game state did not round-trip');

  const placed = await request('/api/bets/place', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      mode: 'TOURNAMENT',
      slot: 1,
      ticket: {
        id: 'loop-ticket',
        type: 'SINGLE',
        selections: [],
        totalOdds: 2,
        stake: 25,
        potentialPayout: 50,
        status: 'PENDING',
        timestamp: 1,
      },
    }),
  });
  if (placed.profile.balance !== 75 || placed.profile.tickets.length !== 1) {
    throw new Error('server-authoritative bet placement did not update balance/ticket');
  }

  const cashed = await request('/api/bets/cash-out', {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({mode: 'TOURNAMENT', slot: 1, ticketId: 'loop-ticket', offerAmount: 10}),
  });
  if (cashed.profile.balance !== 85 || cashed.profile.tickets[0].status !== 'CASHED_OUT') {
    throw new Error('server-authoritative cash-out did not update balance/ticket');
  }
  log('auth, save, place bet, and cash-out APIs passed');
}

async function main() {
  await mkdir(tmpDir, {recursive: true});
  await rm(dbPath, {force: true});
  await run('npm', ['run', 'build']);
  const server = startServer();
  try {
    await waitForFrontend();
    await assertApiLoop();
    log('full-stack smoke test passed');
  } catch (error) {
    console.error(`[fullstack-smoke] failed: ${(error).stack || error}`);
    try {
      const logText = await readFile(serverLogPath, 'utf8');
      console.error(logText);
    } catch {}
    process.exitCode = 1;
  } finally {
    await server.stop();
    await rm(dbPath, {force: true});
  }
}

await main();
