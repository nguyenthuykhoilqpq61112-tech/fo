import {useEffect, useMemo, useState} from 'react';
import {Calendar, Clock, ExternalLink, RefreshCw, ShieldCheck, TrendingUp} from 'lucide-react';
import {fetchWorldCupLive, type WorldCupLiveMatch} from '../api/serverApi';
import {WorldCupTeamButton} from './WorldCupTeamButton';
import {WorldCupTeamModal} from './WorldCupTeamModal';
import type {WorldCupQuickSelection} from './WorldCupQuickBet';

interface WorldCupFixturesOddsProps {
  onQuickBetSelection?: (selection: WorldCupQuickSelection) => void;
}

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function oddsSourceLabel(match: WorldCupLiveMatch) {
  if (match.oddsSource === 'polymarket') return 'Polymarket';
  if (match.oddsSource === 'espn') return 'ESPN market';
  if (match.oddsSource === 'external') return 'External feed';
  return 'Model line';
}

function statusLabel(match: WorldCupLiveMatch) {
  if (match.status === 'LIVE') return `${match.minute || 0}' LIVE`;
  if (match.status === 'FT') return 'FT locked';
  return 'Upcoming';
}

export function WorldCupFixturesOdds({onQuickBetSelection}: WorldCupFixturesOddsProps) {
  const [matches, setMatches] = useState<WorldCupLiveMatch[]>([]);
  const [updatedAt, setUpdatedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamModal, setTeamModal] = useState<string | null>(null);

  const load = async () => {
    try {
      setError('');
      const payload = await fetchWorldCupLive();
      setMatches(payload.matches);
      setUpdatedAt(payload.updatedAt);
    } catch (err) {
      setError((err as Error).message || 'Unable to load World Cup fixtures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const ordered = useMemo(() => {
    return [...matches].sort((a, b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc));
  }, [matches]);
  const upcoming = ordered.filter((match) => match.status !== 'FT');
  const listed = upcoming.length ? upcoming : ordered.slice(-12);
  const polymarketCount = matches.filter((match) => match.oddsSource === 'polymarket').length;

  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <span className="text-[10px] text-emerald-400 font-mono tracking-widest block uppercase font-bold">
            World Cup 2026 Fixtures & Odds
          </span>
          <h2 className="text-xl md:text-2xl font-black text-slate-100 tracking-tight mt-1">
            Upcoming matches, 1X2 prices, and Polymarket overlays
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono text-slate-400">
            <ShieldCheck size={13} className="inline mr-1 text-emerald-300" />
            {polymarketCount} Polymarket matched
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black hover:bg-emerald-300 disabled:opacity-50"
          >
            <RefreshCw size={14} className={`inline mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {updatedAt && (
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">
          Updated {formatKickoff(updatedAt)} · refreshes every 15s
        </div>
      )}
      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {listed.map((match) => (
          <article key={match.id} className="glass-card rounded-2xl overflow-hidden border border-white/5 bg-black/20">
            <div className="bg-white/5 p-3 border-b border-white/5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-black truncate">{match.stage}</div>
                <div className="text-sm font-black text-white truncate">{match.home} vs {match.away}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black border ${
                match.status === 'LIVE'
                  ? 'border-red-400/40 bg-red-500/15 text-red-200'
                  : match.status === 'FT'
                  ? 'border-slate-500/30 bg-slate-500/10 text-slate-300'
                  : 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200'
              }`}>
                {statusLabel(match)}
              </span>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <WorldCupTeamButton team={match.home} onOpen={setTeamModal} />
                <div className="text-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 min-w-[74px]">
                  <div className="text-lg font-black text-emerald-300">
                    {match.status === 'SCHEDULED' ? 'VS' : `${match.homeScore ?? 0}-${match.awayScore ?? 0}`}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest">Score</div>
                </div>
                <WorldCupTeamButton team={match.away} align="right" onOpen={setTeamModal} />
              </div>

              <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">
                <span><Calendar size={13} className="inline mr-1" />{match.venue}, {match.city}</span>
                <span><Clock size={13} className="inline mr-1" />{formatKickoff(match.kickoffUtc)}</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {id: 'HOME' as const, label: match.home, value: match.odds.home, className: 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300'},
                  {id: 'DRAW' as const, label: 'Draw', value: match.odds.draw, className: 'bg-sky-500/10 border-sky-400/20 text-sky-300'},
                  {id: 'AWAY' as const, label: match.away, value: match.odds.away, className: 'bg-amber-500/10 border-amber-400/20 text-amber-300'},
                ].map((line) => (
                  <button
                    key={line.id}
                    type="button"
                    onClick={() => onQuickBetSelection?.({
                      matchId: match.id,
                      matchLabel: `${match.home} vs ${match.away}`,
                      selection: line.id,
                      label: line.label,
                      odds: line.value,
                      kickoffUtc: match.kickoffUtc,
                    })}
                    className={`rounded-xl border p-3 text-left hover:scale-[1.01] transition-transform ${line.className}`}
                  >
                    <div className="text-[9px] text-slate-400 uppercase tracking-wider truncate">{line.label}</div>
                    <div className="text-lg font-black">{line.value.toFixed(2)}</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 text-[10px] font-mono text-slate-500">
                <span>
                  <TrendingUp size={13} className="inline mr-1 text-emerald-300" />
                  Odds source: <span className="text-slate-300 font-bold">{oddsSourceLabel(match)}</span>
                </span>
                {match.polymarket?.url && (
                  <a href={match.polymarket.url} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200 font-bold">
                    Market <ExternalLink size={12} className="inline ml-1" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
      <WorldCupTeamModal team={teamModal} matches={matches} onClose={() => setTeamModal(null)} />
    </section>
  );
}
