import { BetSelection, BetTicket, Fixture } from "../types";

/** Returns true if a single selection won against a completed fixture. */
export function didSelectionWin(sel: BetSelection, match: Fixture): boolean {
  const hScore = Math.floor(match.homeScore);
  const aScore = Math.floor(match.awayScore);

  if (sel.marketType === "MATCH_WINNER") {
    const outcome = hScore > aScore ? "HOME" : aScore > hScore ? "AWAY" : "DRAW";
    return sel.selectionId === outcome;
  }
  if (sel.marketType === "DOUBLE_CHANCE") {
    const outcome = hScore > aScore ? "HOME" : aScore > hScore ? "AWAY" : "DRAW";
    if (sel.selectionId === "HOME_OR_DRAW") return outcome !== "AWAY";
    if (sel.selectionId === "HOME_OR_AWAY") return outcome !== "DRAW";
    if (sel.selectionId === "DRAW_OR_AWAY") return outcome !== "HOME";
    return false;
  }
  if (sel.marketType === "BOTH_TEAMS_TO_SCORE") {
    const bothScored = hScore > 0 && aScore > 0;
    return sel.selectionId === "YES" ? bothScored : !bothScored;
  }
  if (sel.marketType === "OVER_UNDER_GOALS") {
    return overUnderWon(sel.selectionId, hScore + aScore);
  }
  if (sel.marketType === "OVER_UNDER_CORNERS") {
    const total = (match.stats?.home.corners || 0) + (match.stats?.away.corners || 0);
    return overUnderWon(sel.selectionId, total);
  }
  if (sel.marketType === "OVER_UNDER_CARDS") {
    const total =
      (match.stats?.home.yellowCards || 0) + (match.stats?.home.redCards || 0) +
      (match.stats?.away.yellowCards || 0) + (match.stats?.away.redCards || 0);
    return overUnderWon(sel.selectionId, total);
  }
  if (sel.marketType === "OVER_UNDER_SAVES") {
    const total = (match.stats?.home.saves || 0) + (match.stats?.away.saves || 0);
    return overUnderWon(sel.selectionId, total);
  }
  if (sel.marketType === "EXACT_SCORE") {
    return sel.selectionId === `${hScore}-${aScore}`;
  }
  if (sel.marketType === "ANYTIME_GOALSCORER") {
    return match.events.some((ev) => ev.type === "GOAL" && ev.playerId === sel.selectionId);
  }
  return false;
}

function overUnderWon(selectionId: string, total: number): boolean {
  const [mode, lineStr] = selectionId.split("_");
  const line = parseFloat((lineStr || "0").replace("_", "."));
  if (mode === "OVER") return total > line;
  if (mode === "UNDER") return total < line;
  return false;
}

/**
 * Settles pending tickets against a round's completed fixtures.
 * Returns updated tickets plus the total payout for won tickets.
 */
export function settlePendingTickets(
  tickets: BetTicket[],
  completedFixtures: Fixture[],
): { finalTickets: BetTicket[]; totalWinPayoutSum: number } {
  let totalWinPayoutSum = 0;
  const finalTickets = tickets.map((ticket) => {
    if (ticket.status !== "PENDING") return ticket;

    // Multi-single tickets settle per leg: each winning leg pays its own
    // stake × odds, independent of the other legs.
    if (ticket.type === "SINGLE" && ticket.selectionStakes) {
      let payout = 0;
      ticket.selections.forEach((sel) => {
        const match = completedFixtures.find((f) => f.id === sel.fixtureId);
        if (match && didSelectionWin(sel, match)) {
          const key = `${sel.fixtureId}-${sel.marketType}-${sel.selectionId}`;
          payout += (ticket.selectionStakes?.[key] || 0) * sel.odds;
        }
      });
      payout = Math.round(payout * 100) / 100;
      totalWinPayoutSum += payout;
      return {
        ...ticket,
        status: payout > 0 ? ("WON" as const) : ("LOST" as const),
        settledPayout: payout,
      };
    }

    // Accumulators (and legacy singles without per-leg stakes): all legs must win.
    const wonAll = ticket.selections.every((sel) => {
      const match = completedFixtures.find((f) => f.id === sel.fixtureId);
      return match ? didSelectionWin(sel, match) : false;
    });
    if (wonAll) totalWinPayoutSum += ticket.potentialPayout;
    return {
      ...ticket,
      status: wonAll ? ("WON" as const) : ("LOST" as const),
      settledPayout: wonAll ? ticket.potentialPayout : 0,
    };
  });
  return { finalTickets, totalWinPayoutSum };
}
