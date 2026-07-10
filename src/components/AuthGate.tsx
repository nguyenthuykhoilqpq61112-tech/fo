import {FormEvent, useState} from 'react';
import {AuthSession, getStoredSession, login, register, storeSession} from '../api/serverApi';

interface AuthGateProps {
  children: (session: AuthSession) => React.ReactNode;
}

export function AuthGate({children}: AuthGateProps) {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const next = mode === 'login' ? await login(username, password) : await register(username, password);
      storeSession(next);
      setSession(next);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  if (session) return <>{children(session)}</>;

  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-[#05070a] via-[#0b0e14] to-[#121620] text-slate-100 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">⚽</div>
          <h1 className="text-2xl font-black tracking-tight">CU Bet Account</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in so bankrolls, bets, fixtures, and saves are stored on the server database.</p>
        </div>

        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-black/30 p-1 text-sm font-bold">
          <button type="button" onClick={() => setMode('login')} className={`rounded-xl py-2 ${mode === 'login' ? 'bg-emerald-500 text-black' : 'text-slate-300'}`}>Login</button>
          <button type="button" onClick={() => setMode('register')} className={`rounded-xl py-2 ${mode === 'register' ? 'bg-emerald-500 text-black' : 'text-slate-300'}`}>Register</button>
        </div>

        <label className="mb-4 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Username</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} required className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400" />
        </label>
        <label className="mb-5 block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">Password</span>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength={8} required className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400" />
        </label>

        {error && <div className="mb-4 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <button disabled={loading} className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-black text-black transition hover:bg-emerald-300 disabled:opacity-60">
          {loading ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
