import {useEffect, useMemo, useState} from 'react';
import {RefreshCw, Radio, Trophy, MapPin, Clock, Wifi} from 'lucide-react';
import {fetchWorldCupLive, type WorldCupLiveMatch} from '../api/serverApi';
import {WorldCupTeamButton} from './WorldCupTeamButton';
import {WorldCupTeamModal} from './WorldCupTeamModal';

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

function oddsSourceLabel(match: WorldCupLiveMatch) {
  if (match.oddsSource === 'polymarket') return 'Polymarket';
  if (match.oddsSource === 'espn') return 'ESPN';
  if (match.oddsSource === 'external') return 'External';
  return 'Model';
}

export function WorldCupLiveHub() {
  const [matches, setMatches] = useState<WorldCupLiveMatch[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [source, setSource] = useState<string>('fallback');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamModal, setTeamModal] = useState<string | null>(null);

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
  const finishedCount = matches.filter((match) => match.status === 'FT').length;
  const scheduledCount = matches.filter((match) => match.status === 'SCHEDULED').length;
  const currentStage = useMemo(() => {
    const active = sortedMatches.find((match) => match.status === 'LIVE');
    if (active) return active.stage;
    const next = sortedMatches.find((match) => match.status === 'SCHEDULED');
    if (next) return next.stage;
    return sortedMatches.at(-1)?.stage || 'World Cup';
  }, [sortedMatches]);

  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-4">
        <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.85),rgba(0,0,0,0.28)),radial-gradient(circle_at_74%_38%,rgba(16,185,129,0.22),transparent_34%),linear-gradient(135deg,#0f172a,#020617)]" />
          <div className="absolute right-8 top-8 rounded-full border border-red-400/50 bg-red-500/20 px-3 py-1 text-xs font-black text-red-100">
            <Radio size={13} className="inline mr-1 animate-pulse" /> LIVE CHANNEL
          </div>
          <div className="relative z-10 flex min-h-[320px] flex-col justify-end p-6">
            <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">World Cup broadcast center</div>
            <h2 className="mt-2 max-w-2xl text-3xl md:text-5xl font-black text-white">Live channel, match ticker, and in-play market desk</h2>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-3xl">
              {['Main feed', 'Tactical cam', 'Odds desk'].map((channel, index) => (
                <button key={channel} className={`rounded-2xl border px-4 py-3 text-left ${index === 0 ? 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                  <span className="block text-[9px] uppercase tracking-widest opacity-70">Channel {index + 1}</span>
                  <span className="text-sm font-black">{channel}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
          <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">Live ticker</div>
          <div className="mt-3 space-y-3">
            {sortedMatches.filter((match) => match.status !== 'FT').slice(0, 5).map((match) => (
              <div key={match.id} className="rounded-2xl border border-white/10 bg-black/25 p-3">
                <div className="text-xs font-black text-white">{match.home} vs {match.away}</div>
                <div className="mt-1 text-[10px] text-slate-400">{match.stage} · {formatKickoff(match.kickoffUtc)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

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
              Matches refresh every 15 seconds from the live World Cup feed. Set <code className="text-emerald-300">WORLD_CUP_2026_FEED_URL</code> to override the default ESPN scoreboard source.
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
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Matches</div>
            <div className="mt-1 text-2xl font-black text-white">{matches.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-400/20 bg-slate-500/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Completed</div>
            <div className="mt-1 text-2xl font-black text-slate-100">{finishedCount}</div>
          </div>
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Live / Upcoming</div>
            <div className="mt-1 text-2xl font-black text-red-100">{liveCount} / {scheduledCount}</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Current Stage</div>
            <div className="mt-1 text-sm md:text-base font-black text-emerald-200 truncate">{currentStage}</div>
          </div>
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
                <WorldCupTeamButton team={match.home} onOpen={setTeamModal} />
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-emerald-300">
                  {match.status === 'SCHEDULED' ? '—' : `${match.homeScore ?? 0} : ${match.awayScore ?? 0}`}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-slate-500">Score</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Away</div>
                <WorldCupTeamButton team={match.away} align="right" onOpen={setTeamModal} />
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
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
              Odds source: <span className="text-emerald-300 font-black">{oddsSourceLabel(match)}</span>
              {match.polymarket?.question && (
                <span className="normal-case tracking-normal text-slate-400"> · {match.polymarket.question}</span>
              )}
            </div>
          </article>
        ))}
      </div>
      <WorldCupTeamModal team={teamModal} matches={matches} onClose={() => setTeamModal(null)} />
    </section>
  );
}
