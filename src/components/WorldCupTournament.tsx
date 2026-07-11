import {useEffect, useMemo, useState} from 'react';
import {Clock, MapPin, RefreshCw, Trophy} from 'lucide-react';
import {fetchWorldCupLive, type WorldCupLiveMatch} from '../api/serverApi';
import {WorldCupTeamButton} from './WorldCupTeamButton';
import {WorldCupTeamModal} from './WorldCupTeamModal';

const knockoutOrder = [
  'Round of 32',
  'Round of 16',
  'Quarterfinals',
  'Quarter-finals',
  'Quarter-final',
  'Semifinals',
  'Semi-finals',
  'Semi-final',
  'Third-place match',
  'Final',
];

function formatKickoff(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function stageRank(stage: string) {
  const index = knockoutOrder.findIndex((label) => stage.toLowerCase().includes(label.toLowerCase()));
  if (index >= 0) return index;
  if (stage.toLowerCase().includes('group')) return -1;
  return 99;
}

function winnerLabel(match: WorldCupLiveMatch) {
  if (match.status !== 'FT') return '';
  const home = match.homeScore ?? 0;
  const away = match.awayScore ?? 0;
  if (home > away) return match.home;
  if (away > home) return match.away;
  return 'Decided after extra time / penalties';
}

export function WorldCupTournament() {
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
      setError((err as Error).message || 'Unable to load World Cup tournament');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, WorldCupLiveMatch[]>();
    [...matches]
      .sort((a, b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc))
      .forEach((match) => {
        const label = match.stage || 'World Cup';
        map.set(label, [...(map.get(label) || []), match]);
      });
    return [...map.entries()].sort((a, b) => {
      const rank = stageRank(a[0]) - stageRank(b[0]);
      if (rank !== 0) return rank;
      return Date.parse(a[1][0]?.kickoffUtc || '') - Date.parse(b[1][0]?.kickoffUtc || '');
    });
  }, [matches]);

  const completed = matches.filter((match) => match.status === 'FT').length;
  const live = matches.filter((match) => match.status === 'LIVE').length;

  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="glass-panel rounded-3xl border-white/10 p-5 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-amber-500/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest block uppercase font-bold">
              World Cup 2026 Tournament
            </span>
            <h2 className="mt-1 text-2xl md:text-3xl font-black text-white tracking-tight">
              Complete stage map from group play to the final
            </h2>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black hover:bg-emerald-300 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`inline mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Matches</div>
            <div className="mt-1 text-2xl font-black text-white">{matches.length}</div>
          </div>
          <div className="rounded-2xl border border-slate-400/20 bg-slate-500/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Completed</div>
            <div className="mt-1 text-2xl font-black text-slate-100">{completed}</div>
          </div>
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Live</div>
            <div className="mt-1 text-2xl font-black text-red-100">{live}</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3">
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-black">Updated</div>
            <div className="mt-1 text-xs font-black text-emerald-200 truncate">{updatedAt ? formatKickoff(updatedAt) : 'Loading'}</div>
          </div>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">{error}</div>}

      <div className="overflow-x-auto pb-4 no-scrollbar">
        <div className="flex items-start gap-4 min-w-max">
          {grouped.map(([stage, stageMatches]) => (
            <div key={stage} className="w-[290px] shrink-0">
              <div className="sticky top-0 z-10 rounded-xl border border-white/10 bg-slate-950/90 backdrop-blur px-3 py-2 text-center text-[10px] font-extrabold tracking-widest text-slate-300 uppercase font-mono mb-3">
                {stage}
              </div>
              <div className="space-y-3">
                {stageMatches.map((match, index) => {
                  const winner = winnerLabel(match);
                  return (
                    <article key={match.id} className={`glass-card rounded-2xl border p-3 ${
                      match.status === 'LIVE'
                        ? 'border-red-400/30 bg-red-500/10'
                        : match.status === 'FT'
                        ? 'border-white/5 bg-black/30 opacity-90'
                        : 'border-emerald-400/20 bg-emerald-500/5'
                    }`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Match {index + 1}</span>
                        <span className="text-[9px] text-emerald-300 font-black">
                          {match.status === 'LIVE' ? `${match.minute || 0}' LIVE` : match.status}
                        </span>
                      </div>
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <WorldCupTeamButton team={match.home} onOpen={setTeamModal} />
                          <span className="font-mono text-slate-100">{match.status === 'SCHEDULED' ? '-' : match.homeScore ?? 0}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <WorldCupTeamButton team={match.away} onOpen={setTeamModal} />
                          <span className="font-mono text-slate-100">{match.status === 'SCHEDULED' ? '-' : match.awayScore ?? 0}</span>
                        </div>
                      </div>
                      {winner && (
                        <div className="mt-2 rounded-lg bg-emerald-500/10 border border-emerald-400/20 px-2 py-1 text-[10px] text-emerald-200 font-bold truncate">
                          <Trophy size={11} className="inline mr-1" />
                          {winner}
                        </div>
                      )}
                      <div className="mt-3 space-y-1 text-[10px] text-slate-500">
                        <div><Clock size={12} className="inline mr-1" />{formatKickoff(match.kickoffUtc)}</div>
                        <div className="truncate"><MapPin size={12} className="inline mr-1" />{match.venue}, {match.city}</div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <WorldCupTeamModal team={teamModal} matches={matches} onClose={() => setTeamModal(null)} />
    </section>
  );
}
