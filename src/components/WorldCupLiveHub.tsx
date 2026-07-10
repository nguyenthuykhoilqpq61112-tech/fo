import {useEffect, useMemo, useState} from 'react';
import {RefreshCw, Radio, Trophy, MapPin, Clock, Wifi} from 'lucide-react';
import {fetchWorldCupLive, type WorldCupLiveMatch} from '../api/serverApi';

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusStyles(status: WorldCupLiveMatch['status']) {
  if (status === 'LIVE') return 'border-red-400/40 bg-red-500/15 text-red-200';
  if (status === 'FT') return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
  return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
}

export function WorldCupLiveHub() {
  const [matches, setMatches] = useState<WorldCupLiveMatch[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [source, setSource] = useState<string>('fallback');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const payload = await fetchWorldCupLive();
      setMatches(payload.matches);
      setUpdatedAt(payload.updatedAt);
      setSource(payload.source);
    } catch (err) {
      setError((err as Error).message || 'Unable to load World Cup live feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc));
  }, [matches]);

  const liveCount = matches.filter((match) => match.status === 'LIVE').length;

  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="glass-panel p-5 rounded-3xl border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-sky-500/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-black uppercase tracking-[0.25em]">
              <Trophy size={16} /> World Cup 2026 Live Betting
            </div>
            <h2 className="mt-2 text-2xl md:text-4xl font-black tracking-tight text-white">
              Real-time match board, prices, and market status
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-3xl">
              Matches refresh every 15 seconds. Connect <code className="text-emerald-300">WORLD_CUP_2026_FEED_URL</code> on the server for an official/paid live data feed; otherwise the site uses the bundled World Cup 2026 fallback board for deployment testing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
              <Radio size={16} className="inline mr-2 animate-pulse" /> {liveCount} live
            </div>
            <button onClick={load} className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black hover:bg-emerald-300 disabled:opacity-50" disabled={loading}>
              <RefreshCw size={16} className={`inline mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-400">
          <span><Wifi size={13} className="inline mr-1" /> source: {source}</span>
          {updatedAt && <span><Clock size={13} className="inline mr-1" /> updated: {formatKickoff(updatedAt)}</span>}
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {sortedMatches.map((match) => (
          <article key={match.id} className="glass-panel rounded-3xl border-white/10 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-emerald-300 font-black">{match.stage}</div>
                <h3 className="mt-1 text-xl md:text-2xl font-black text-white">{match.home} vs {match.away}</h3>
              </div>
              <div className={`rounded-full border px-3 py-1 text-xs font-black ${statusStyles(match.status)}`}>
                {match.status === 'LIVE' ? `${match.minute}' LIVE` : match.status}
              </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-black/25 p-4">
              <div className="text-left">
                <div className="text-sm text-slate-400">Home</div>
                <div className="text-lg font-black text-white">{match.home}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-300">
                  {match.status === 'SCHEDULED' ? '—' : `${match.homeScore ?? 0} : ${match.awayScore ?? 0}`}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Score</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Away</div>
                <div className="text-lg font-black text-white">{match.away}</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              <span><MapPin size={13} className="inline mr-1" /> {match.venue}, {match.city}</span>
              <span><Clock size={13} className="inline mr-1" /> {formatKickoff(match.kickoffUtc)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button disabled={!match.marketOpen} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-left disabled:opacity-40">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">{match.home}</span>
                <span className="text-lg font-black text-emerald-300">{match.odds.home.toFixed(2)}</span>
              </button>
              <button disabled={!match.marketOpen} className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-3 text-left disabled:opacity-40">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">Draw</span>
                <span className="text-lg font-black text-sky-300">{match.odds.draw.toFixed(2)}</span>
              </button>
              <button disabled={!match.marketOpen} className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-3 text-left disabled:opacity-40">
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider">{match.away}</span>
                <span className="text-lg font-black text-purple-300">{match.odds.away.toFixed(2)}</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
