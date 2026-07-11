import {worldCupTeamSummary} from '../utils/worldCupMeta';

interface WorldCupTeamButtonProps {
  team: string;
  align?: 'left' | 'right';
  onOpen?: (team: string) => void;
}

export function WorldCupTeamButton({team, align = 'left', onOpen}: WorldCupTeamButtonProps) {
  const meta = worldCupTeamSummary(team);
  return (
    <button
      type="button"
      onClick={() => onOpen?.(team)}
      className={`group flex items-center gap-2 min-w-0 hover:opacity-85 transition-opacity ${align === 'right' ? 'flex-row-reverse text-right' : 'text-left'}`}
      title={`View ${team} details`}
    >
      <span
        className="h-9 w-9 rounded-full border border-white/15 bg-black/30 flex items-center justify-center text-lg shadow-lg shrink-0"
        style={{boxShadow: `0 0 18px ${meta.color}33`}}
      >
        {meta.flag}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-100 truncate group-hover:text-emerald-300">{team}</span>
        <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-500">{meta.federation}</span>
      </span>
    </button>
  );
}
