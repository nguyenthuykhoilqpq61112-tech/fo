import {FormEvent, useState} from 'react';
import {AuthSession, getStoredSession, login, register, storeSession} from '../api/serverApi';
import {Gift, ShieldCheck, Trophy, UserPlus, X} from 'lucide-react';

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
  const [showAuth, setShowAuth] = useState(false);
  const [showPromo, setShowPromo] = useState(true);

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
    <div className="min-h-screen w-screen bg-[#07090d] text-slate-100 overflow-y-auto">
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <button className="flex items-center gap-2 font-black uppercase tracking-wider text-emerald-300">
            <Trophy size={20} />
            win-worldcup
          </button>
          <div className="hidden items-center gap-5 text-xs font-bold text-slate-300 md:flex">
            <span>World Cup sportsbook</span>
            <span>Live odds</span>
            <span>USDT cashier</span>
            <span>Responsible gaming</span>
          </div>
          <button onClick={() => setShowAuth(true)} className="rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-black hover:bg-emerald-300">
            Login / Register
          </button>
        </div>
      </header>

      <main className="relative min-h-screen pt-16">
        <section className="relative min-h-[720px] overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.94),rgba(0,0,0,0.62),rgba(0,0,0,0.18)),radial-gradient(circle_at_74%_34%,rgba(16,185,129,0.22),transparent_32%),linear-gradient(135deg,#0b1117,#14191f)]" />
          <div className="absolute right-[-9%] top-24 hidden h-[560px] w-[560px] rounded-full border-[42px] border-emerald-300/10 lg:block" />
          <div className="absolute bottom-0 right-0 hidden h-[580px] w-[620px] lg:block">
            <div className="absolute bottom-[-140px] right-28 h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="absolute bottom-24 right-52 h-40 w-40 rounded-full border-[10px] border-white/80 bg-[radial-gradient(circle_at_35%_35%,white_0_8%,#101827_9%_16%,white_17%_24%,#101827_25%_32%,white_33%)] shadow-2xl" />
            <div className="absolute bottom-0 right-16 h-[460px] w-[250px] rounded-t-full bg-gradient-to-b from-lime-300 via-emerald-500 to-slate-950 shadow-[0_0_80px_rgba(16,185,129,0.2)]" />
          </div>
          <div className="relative z-10 mx-auto grid min-h-[720px] max-w-7xl content-center gap-10 px-5 py-16 lg:grid-cols-[1fr_420px]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-200">
                <Gift size={14} />
                Welcome bonus plus deposit match
              </div>
              <h1 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-normal text-white md:text-7xl">
                World Cup betting, live lines, instant slips
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
                Follow World Cup 2026 live channels, fixtures, props, parlay markets, loyalty points, and USDT cashier requests from one professional sportsbook lobby.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button onClick={() => { setMode('register'); setShowAuth(true); }} className="rounded-2xl bg-emerald-400 px-6 py-4 text-sm font-black uppercase text-black hover:bg-emerald-300">
                  Bet now
                </button>
                <button onClick={() => setShowPromo(true)} className="rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black uppercase text-white hover:bg-white/15">
                  View bonuses
                </button>
              </div>
              <div className="mt-8 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
                {['Min deposit $20', 'Min bet $1', '100% match', 'USDT TRC20'].map((label) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-200">
                    {label}
                  </div>
                ))}
              </div>
            </div>
            <aside className="rounded-3xl border border-white/10 bg-black/50 p-5 shadow-2xl backdrop-blur-xl">
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Live market board</div>
              <div className="mt-4 space-y-3">
                {[
                  ['Argentina', 'Draw', 'Switzerland', '1.68', '3.70', '5.20'],
                  ['Spain', 'Draw', 'Belgium', '1.92', '3.30', '4.10'],
                  ['England', 'Draw', 'Norway', '1.85', '3.55', '4.40'],
                ].map((row) => (
                  <div key={row[0]} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="mb-2 text-xs font-bold text-white">{row[0]} vs {row[2]}</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2].map((index) => (
                        <button key={index} onClick={() => { setMode('register'); setShowAuth(true); }} className="rounded-xl bg-emerald-400/10 px-2 py-2 text-left hover:bg-emerald-400 hover:text-black">
                          <span className="block truncate text-[9px] uppercase">{row[index]}</span>
                          <span className="text-sm font-black">{row[index + 3]}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </main>

      {showPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className="relative max-w-lg rounded-3xl border border-emerald-300/25 bg-[#10141a] p-6 shadow-2xl">
            <button onClick={() => setShowPromo(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-slate-300 hover:text-white">
              <X size={16} />
            </button>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-black">
              <Gift size={24} />
            </div>
            <h2 className="mt-4 text-3xl font-black uppercase text-white">Bet today, unlock bonus credit</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Register now to claim welcome bonus access, deposit match offers, daily World Cup rewards, referral boosts, and loyalty points on every settled bet.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {['100% match', 'Daily bonus', 'VIP tiers'].map((item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-black text-emerald-200">{item}</div>
              ))}
            </div>
            <button onClick={() => { setShowPromo(false); setMode('register'); setShowAuth(true); }} className="mt-5 w-full rounded-2xl bg-emerald-400 py-3 text-sm font-black uppercase text-black hover:bg-emerald-300">
              Bet now
            </button>
          </div>
        </div>
      )}

      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <form onSubmit={submit} className="relative w-full max-w-md rounded-3xl border border-white/10 bg-[#10141a] p-8 shadow-2xl">
            <button type="button" onClick={() => setShowAuth(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-slate-300 hover:text-white">
              <X size={16} />
            </button>
            <div className="mb-8 text-center">
              <ShieldCheck className="mx-auto mb-3 text-emerald-300" size={36} />
              <h1 className="text-2xl font-black tracking-tight">win-worldcup account</h1>
              <p className="mt-2 text-sm text-slate-400">Create or access your sportsbook wallet, bonuses, and live betting dashboard.</p>
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
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : <span className="inline-flex items-center gap-2"><UserPlus size={16} />Create account</span>}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
