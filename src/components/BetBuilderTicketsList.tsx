import React from "react";
import { BetBuilderTicket, Fixture, Team } from "../types";
import { formatMoney } from "../utils";

interface BetBuilderTicketsListProps {
  tickets: BetBuilderTicket[];
  fixtures: Fixture[];
  teams: Team[];
}

export const BetBuilderTicketsList: React.FC<BetBuilderTicketsListProps> = ({
  tickets,
  fixtures,
  teams,
}) => {
  if (tickets.length === 0) return null;

  const getMatchup = (fixtureId: string): string => {
    const fix = fixtures.find((f) => f.id === fixtureId);
    if (!fix) return "Unknown Fixture";
    const h = teams.find((t) => t.id === fix.homeTeamId);
    const a = teams.find((t) => t.id === fix.awayTeamId);
    return `${h?.shortName ?? "?"} vs ${a?.shortName ?? "?"}`;
  };

  const sorted = [...tickets].sort((a, b) => b.placedAt - a.placedAt);

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black tracking-widest text-amber-400 uppercase pt-2">
        ⚡ Bet Builder Tickets
      </h3>
      <div className="space-y-2.5">
        {sorted.map((ticket) => {
          const isWon = ticket.status === "WON";
          const isLost = ticket.status === "LOST";
          return (
            <div
              key={ticket.id}
              className={`glass-card rounded-2xl overflow-hidden border ${
                isWon
                  ? "border-emerald-500/20"
                  : isLost
                  ? "border-red-500/15 opacity-70"
                  : "border-amber-500/20"
              }`}
            >
              <div className="px-4 py-2.5 flex items-center justify-between bg-black/20">
                <div>
                  <p className="text-xs font-black text-white">{getMatchup(ticket.fixtureId)}</p>
                  <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">
                    Bet Builder • {ticket.selections.length} legs • Round {ticket.placedAt + 1}
                  </p>
                </div>
                <span
                  className={`text-[9px] font-black font-mono uppercase rounded px-2 py-1 ${
                    isWon
                      ? "bg-emerald-500/15 text-emerald-400"
                      : isLost
                      ? "bg-red-500/15 text-red-400"
                      : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {ticket.status}
                </span>
              </div>
              <div className="px-4 py-2 space-y-1">
                {ticket.selections.map((sel, i) => (
                  <p key={i} className="text-[10px] text-slate-400 font-mono">
                    • {sel.label} <span className="text-slate-600">@{sel.odds.toFixed(2)}</span>
                  </p>
                ))}
              </div>
              <div className="px-4 py-2 flex items-center justify-between text-[11px] font-mono border-t border-white/5 text-slate-400">
                <span>
                  Stake: <span className="text-white font-bold">${formatMoney(ticket.stake)}</span>
                  {" · "}Odds: <span className="text-amber-400 font-bold">{ticket.combinedOdds.toFixed(2)}</span>
                </span>
                <span>
                  {isWon ? "Returned: " : "Potential: "}
                  <span className={`font-bold ${isWon ? "text-emerald-400" : isLost ? "text-red-400 line-through" : "text-white"}`}>
                    ${formatMoney(ticket.potentialPayout)}
                  </span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
