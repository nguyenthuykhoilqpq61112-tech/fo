import {X, Trophy, TrendingUp} from 'lucide-react';
import type {WorldCupLiveMatch} from '../api/serverApi';
import {worldCupTeamSummary} from '../utils/worldCupMeta';

interface WorldCupTeamModalProps {
  team: string | null;
  matches: WorldCupLiveMatch[];
  onClose: () => void;
}

export function WorldCupTeamModal({team, matches, onClose}: WorldCupTeamModalProps) {
  if (!team) return null;
  const meta = worldCupTeamSummary(team);
  const teamMatches = matches.filter((match) => match.home === team || match.away === team);
  const finished = teamMatches.filter((match) => match.status === 'FT');
  const wins = finished.filter((match) => {
    const home = match.homeScore ?? 0;
    const away = match.awayScore ?? 0;
    return (match.home === team && home > away) || (match.away === team && away > home);
  }).length;
  const goalsFor = finished.reduce((sum, match) => sum + (match.home === team ? match.homeScore ?? 0 : match.awayScore ?? 0), 0);
  const goalsAgainst = finished.reduce((sum, match) => sum + (match.home === team ? match.awayScore ?? 0 : match.homeScore ?? 0), 0);
  const next = teamMatches.find((match) => match.status !== 'FT');

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass-panel-heavy max-w-lg w-full rounded-3xl border border-white/10 p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-16 w-16 rounded-2xl border border-white/10 bg-black/35 flex items-center justify-center text-4xl" style={{boxShadow: `0 0 26px ${meta.color}44`}}>
              {meta.flag}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-mono font-black">{meta.federation} squad profile</div>
              <h3 className="text-2xl font-black text-white truncate">{team}</h3>
            </div>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10">
            <X size={16} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Matches</div>
            <div className="text-xl font-black text-white">{teamMatches.length}</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Wins</div>
            <div className="text-xl font-black text-emerald-300">{wins}</div>
          </div>
          <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-3">
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-mono">Goals</div>
            <div className="text-xl font-black text-sky-300">{goalsFor}-{goalsAgainst}</div>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono font-black">
            <Trophy size={13} className="text-emerald-300" />
            Next World Cup fixture
          </div>
          {next ? (
            <div className="mt-2">
              <div className="text-sm font-black text-white">{next.home} vs {next.away}</div>
              <div className="mt-1 text-xs text-slate-400">{next.stage} · {new Date(next.kickoffUtc).toLocaleString()}</div>
              <div className="mt-2 text-xs text-emerald-300 font-bold">
                <TrendingUp size={13} className="inline mr-1" />
                1X2: {next.odds.home.toFixed(2)} / {next.odds.draw.toFixed(2)} / {next.odds.away.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-400">No upcoming fixture in the current feed.</div>
          )}
        </div>
      </div>
    </div>
  );
}
