import {useEffect, useMemo, useState} from 'react';
import {Banknote, CheckCircle2, Clock, RefreshCw, Trash2} from 'lucide-react';
import {fetchWorldCupLive, type WorldCupLiveMatch} from '../api/serverApi';
import {WorldCupTeamButton} from './WorldCupTeamButton';
import {WorldCupTeamModal} from './WorldCupTeamModal';

export interface WorldCupQuickSelection {
  matchId: string;
  matchLabel: string;
  selection: 'HOME' | 'DRAW' | 'AWAY';
  label: string;
  odds: number;
  kickoffUtc: string;
}

interface PlacedWorldCupBet {
  id: string;
  selections: WorldCupQuickSelection[];
  stake: number;
  totalOdds: number;
  potentialPayout: number;
  placedAt: string;
}

interface WorldCupQuickBetProps {
  initialSelection?: WorldCupQuickSelection | null;
  onInitialSelectionConsumed?: () => void;
}

const HISTORY_KEY = 'wc_quick_bets_v1';

function loadHistory(): PlacedWorldCupBet[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function WorldCupQuickBet({initialSelection, onInitialSelectionConsumed}: WorldCupQuickBetProps) {
  const [matches, setMatches] = useState<WorldCupLiveMatch[]>([]);
  const [selections, setSelections] = useState<WorldCupQuickSelection[]>([]);
  const [stake, setStake] = useState(20);
  const [history, setHistory] = useState<PlacedWorldCupBet[]>(() => loadHistory());
  const [teamModal, setTeamModal] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    const payload = await fetchWorldCupLive();
    setMatches(payload.matches);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => setLoading(false));
    const timer = window.setInterval(() => load().catch(() => undefined), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!initialSelection) return;
    setSelections((prev) => {
      const filtered = prev.filter((item) => item.matchId !== initialSelection.matchId);
      return [...filtered, initialSelection];
    });
    onInitialSelectionConsumed?.();
  }, [initialSelection, onInitialSelectionConsumed]);

  const upcoming = useMemo(() => {
    return matches
      .filter((match) => match.status !== 'FT')
      .sort((a, b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc))
      .slice(0, 8);
  }, [matches]);

  const totalOdds = selections.reduce((product, selection) => product * selection.odds, 1);
  const payout = stake * totalOdds;

  const pick = (match: WorldCupLiveMatch, selection: WorldCupQuickSelection['selection'], label: string, odds: number) => {
    const next: WorldCupQuickSelection = {
      matchId: match.id,
      matchLabel: `${match.home} vs ${match.away}`,
      selection,
      label,
      odds,
      kickoffUtc: match.kickoffUtc,
    };
    setSelections((prev) => [...prev.filter((item) => item.matchId !== match.id), next]);
    setMessage('');
  };

  const placeBet = () => {
    if (!selections.length || stake <= 0) return;
    const bet: PlacedWorldCupBet = {
      id: `wc-${Date.now()}`,
      selections,
      stake,
      totalOdds,
      potentialPayout: payout,
      placedAt: new Date().toISOString(),
    };
    const next = [bet, ...history].slice(0, 30);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    setSelections([]);
    setMessage('One-click World Cup bet placed.');
  };

  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="glass-panel rounded-3xl border-white/10 p-5 bg-gradient-to-br from-emerald-500/10 via-white/[0.03] to-sky-500/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="text-[10px] text-emerald-400 font-mono tracking-widest block uppercase font-bold">One-click betting</span>
            <h2 className="mt-1 text-2xl md:text-3xl font-black text-white tracking-tight">World Cup 2026 quick slip</h2>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">Click a World Cup price, confirm stake, and place the slip from this page.</p>
          </div>
          <button onClick={load} disabled={loading} className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-black hover:bg-emerald-300 disabled:opacity-50">
            <RefreshCw size={16} className={`inline mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {upcoming.map((match) => (
            <article key={match.id} className="glass-card rounded-2xl border border-white/5 bg-black/20 overflow-hidden">
              <div className="p-3 border-b border-white/5 bg-white/5">
                <div className="text-[10px] text-emerald-400 font-mono uppercase tracking-widest font-black">{match.stage}</div>
                <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <WorldCupTeamButton team={match.home} onOpen={setTeamModal} />
                  <span className="text-xs text-slate-500 font-black">VS</span>
                  <WorldCupTeamButton team={match.away} align="right" onOpen={setTeamModal} />
                </div>
              </div>
              <div className="p-3 space-y-3">
                <div className="text-[11px] text-slate-400">
                  <Clock size={13} className="inline mr-1" />
                  {new Date(match.kickoffUtc).toLocaleString()}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {id: 'HOME' as const, label: match.home, odds: match.odds.home},
                    {id: 'DRAW' as const, label: 'Draw', odds: match.odds.draw},
                    {id: 'AWAY' as const, label: match.away, odds: match.odds.away},
                  ].map((line) => {
                    const selected = selections.some((item) => item.matchId === match.id && item.selection === line.id);
                    return (
                      <button
                        key={line.id}
                        type="button"
                        onClick={() => pick(match, line.id, line.label, line.odds)}
                        className={`rounded-xl border p-3 text-left transition-colors ${
                          selected ? 'bg-emerald-400 text-black border-emerald-300' : 'bg-white/5 border-white/10 hover:border-emerald-400/40 text-slate-100'
                        }`}
                      >
                        <span className="block text-[9px] uppercase tracking-wider truncate">{line.label}</span>
                        <span className="text-lg font-black">{line.odds.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="glass-panel rounded-3xl border-white/10 p-4 h-fit space-y-4">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-300 font-mono font-black">Quick slip</span>
            <h3 className="text-lg font-black text-white">One-click bet</h3>
          </div>
          <div className="space-y-2">
            {selections.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">Select an odds price to build a slip.</div>
            ) : selections.map((selection) => (
              <div key={selection.matchId} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white truncate">{selection.matchLabel}</div>
                    <div className="text-[10px] text-slate-400">{selection.label} · {selection.odds.toFixed(2)}</div>
                  </div>
                  <button onClick={() => setSelections((prev) => prev.filter((item) => item.matchId !== selection.matchId))} className="text-red-300 hover:text-red-200">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <label className="block">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-black">Stake</span>
            <input
              type="number"
              min={1}
              value={stake}
              onChange={(event) => setStake(Math.max(1, Number(event.target.value) || 1))}
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
          </label>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
            <div className="flex justify-between text-xs text-slate-400"><span>Total odds</span><span className="font-black text-emerald-300">{selections.length ? totalOdds.toFixed(2) : '0.00'}</span></div>
            <div className="mt-1 flex justify-between text-xs text-slate-400"><span>Potential payout</span><span className="font-black text-white">${selections.length ? payout.toFixed(2) : '0.00'}</span></div>
          </div>
          <button onClick={placeBet} disabled={!selections.length} className="w-full rounded-2xl bg-emerald-400 py-3 text-sm font-black text-black hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed">
            <Banknote size={16} className="inline mr-2" />
            Place one-click bet
          </button>
          {message && <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200"><CheckCircle2 size={15} className="inline mr-1" />{message}</div>}
          {history.length > 0 && (
            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono font-black">Recent World Cup bets</div>
              {history.slice(0, 4).map((bet) => (
                <div key={bet.id} className="rounded-xl bg-black/25 border border-white/5 p-2 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-200">{bet.selections.length} picks · ${bet.stake.toFixed(2)} stake</div>
                  <div>{new Date(bet.placedAt).toLocaleString()} · payout ${bet.potentialPayout.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
      <WorldCupTeamModal team={teamModal} matches={matches} onClose={() => setTeamModal(null)} />
    </section>
  );
}
