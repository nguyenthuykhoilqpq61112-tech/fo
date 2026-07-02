import { Challenge, ChallengeType, BetTicket, BetBuilderTicket, Fixture } from "../types";

type ChallengeTemplate = Omit<Challenge, "id" | "progress" | "status" | "expiresAtRound">;

export const CHALLENGE_POOL: ChallengeTemplate[] = [
  { type: "WIN_ACCUMULATORS", title: "Acca Apprentice", description: "Win 1 accumulator bet", target: 1, reward: 150, bonusXP: 20 },
  { type: "WIN_ACCUMULATORS", title: "Acca Addict", description: "Win 2 accumulator bets", target: 2, reward: 400, bonusXP: 50 },
  { type: "WIN_ACCUMULATORS", title: "Acca Assassin", description: "Win 3 accumulator bets", target: 3, reward: 900, bonusXP: 100 },
  { type: "BET_ON_UNDERDOG_WIN", title: "Giant Killer", description: "Win a bet on a team with odds over 3.0", target: 1, reward: 250, bonusXP: 40 },
  { type: "BET_ON_UNDERDOG_WIN", title: "Upset Artist", description: "Win 2 bets on teams with odds over 3.0", target: 2, reward: 600, bonusXP: 80 },
  { type: "BET_ON_UNDERDOG_WIN", title: "Chaos Merchant", description: "Win 3 underdog bets (odds over 3.0)", target: 3, reward: 1200, bonusXP: 150 },
  { type: "CASHOUT_PROFIT", title: "Smart Exit", description: "Cash out a bet while in profit", target: 1, reward: 100, bonusXP: 15 },
  { type: "CASHOUT_PROFIT", title: "Take the Money", description: "Cash out 2 bets while in profit", target: 2, reward: 300, bonusXP: 40 },
  { type: "BET_BUILDER_WIN", title: "Master Builder", description: "Win a Bet Builder", target: 1, reward: 300, bonusXP: 40 },
  { type: "BET_BUILDER_WIN", title: "Architect", description: "Win 2 Bet Builders", target: 2, reward: 750, bonusXP: 90 },
  { type: "WIN_STREAK", title: "Hot Hand", description: "Win at least one bet in 2 rounds in a row", target: 2, reward: 200, bonusXP: 30 },
  { type: "WIN_STREAK", title: "On Fire", description: "Win at least one bet in 3 rounds in a row", target: 3, reward: 500, bonusXP: 70 },
  { type: "BET_ON_DRAW", title: "Fence Sitter", description: "Win a bet on a draw", target: 1, reward: 200, bonusXP: 25 },
  { type: "BET_ON_DRAW", title: "Stalemate Specialist", description: "Win 2 bets on draws", target: 2, reward: 500, bonusXP: 60 },
  { type: "WIN_ACCUMULATORS", title: "Weekend Warrior", description: "Win 1 accumulator bet", target: 1, reward: 180, bonusXP: 25 },
  { type: "BET_ON_UNDERDOG_WIN", title: "Longshot Larry", description: "Win a bet at odds over 3.0", target: 1, reward: 275, bonusXP: 35 },
  { type: "CASHOUT_PROFIT", title: "Exit Strategy", description: "Cash out a winning position", target: 1, reward: 120, bonusXP: 20 },
  { type: "BET_BUILDER_WIN", title: "Combo King", description: "Land a Bet Builder", target: 1, reward: 350, bonusXP: 45 },
  { type: "BET_ON_DRAW", title: "Bore Draw Bandit", description: "Correctly back a draw", target: 1, reward: 220, bonusXP: 30 },
  { type: "WIN_STREAK", title: "Momentum", description: "Win at least one bet in 2 consecutive rounds", target: 2, reward: 250, bonusXP: 35 },
];

/** Picks 3 random challenges (distinct types where possible) for a round. */
export function generateRoundChallenges(roundIndex: number): Challenge[] {
  const shuffled = [...CHALLENGE_POOL].sort(() => Math.random() - 0.5);
  const picked: ChallengeTemplate[] = [];
  const usedTypes = new Set<ChallengeType>();
  for (const tpl of shuffled) {
    if (picked.length >= 3) break;
    if (usedTypes.has(tpl.type)) continue;
    usedTypes.add(tpl.type);
    picked.push(tpl);
  }
  return picked.map((tpl, i) => ({
    ...tpl,
    id: `chal_${roundIndex}_${Date.now()}_${i}`,
    progress: 0,
    status: "ACTIVE" as const,
    expiresAtRound: roundIndex + (tpl.type === "WIN_STREAK" ? Math.max(2, tpl.target) : 2),
  }));
}

interface RoundResults {
  settledTickets: BetTicket[];       // tickets settled this round (WON/LOST/CASHED_OUT)
  settledBbTickets?: BetBuilderTicket[];
  fixtures: Fixture[];               // completed fixtures of the round
  roundIndex: number;
}

function countForType(type: ChallengeType, r: RoundResults): number {
  const won = r.settledTickets.filter((t) => t.status === "WON");
  switch (type) {
    case "WIN_ACCUMULATORS":
      return won.filter((t) => t.type === "ACCUMULATOR").length;
    case "BET_ON_UNDERDOG_WIN":
      return won.filter((t) => t.selections.some((s) => s.odds > 3.0)).length;
    case "CASHOUT_PROFIT":
      return r.settledTickets.filter(
        (t) => t.status === "CASHED_OUT" && (t.cashedOutAmount ?? 0) > t.stake,
      ).length;
    case "BET_BUILDER_WIN":
      return (r.settledBbTickets ?? []).filter((t) => t.status === "WON").length;
    case "WIN_STREAK":
      // Progress by 1 if at least one bet won this round; reset handled below.
      return won.length > 0 ? 1 : 0;
    case "BET_ON_DRAW":
      return won.filter((t) =>
        t.selections.some((s) => {
          if (s.marketType !== "MATCH_WINNER" || s.selectionId !== "DRAW") return false;
          const fx = r.fixtures.find((f) => f.id === s.fixtureId);
          return fx ? Math.floor(fx.homeScore) === Math.floor(fx.awayScore) : false;
        }),
      ).length;
  }
}

/** Evaluates active challenges against a settled round and updates progress/status. */
export function evaluateChallenges(
  challenges: Challenge[],
  settledTickets: BetTicket[],
  fixtures: Fixture[],
  roundIndex: number,
  settledBbTickets?: BetBuilderTicket[],
): Challenge[] {
  const results: RoundResults = { settledTickets, settledBbTickets, fixtures, roundIndex };
  const hadBets = settledTickets.length > 0;
  const anyWon = settledTickets.some((t) => t.status === "WON");

  return challenges.map((c) => {
    if (c.status !== "ACTIVE") return c;
    let progress = c.progress;
    const inc = countForType(c.type, results);
    if (c.type === "WIN_STREAK" && hadBets && !anyWon) {
      progress = 0; // streak broken
    } else {
      progress += inc;
    }
    if (progress >= c.target) {
      return { ...c, progress: c.target, status: "COMPLETED" as const };
    }
    if (roundIndex >= c.expiresAtRound) {
      return { ...c, progress, status: "EXPIRED" as const };
    }
    return { ...c, progress };
  });
}
