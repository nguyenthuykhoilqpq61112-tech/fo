import { Position, PlayerSeasonStats, Player } from "../types";

export function generatePlayerAge(position: Position): number {
  switch (position) {
    case "GK":
      return Math.floor(Math.random() * (38 - 22 + 1)) + 22; // 22-38
    case "DEF":
      return Math.floor(Math.random() * (35 - 20 + 1)) + 20; // 20-35
    case "MID":
      return Math.floor(Math.random() * (33 - 19 + 1)) + 19; // 19-33
    case "ATT":
      return Math.floor(Math.random() * (32 - 18 + 1)) + 18; // 18-32
    default:
      return 25;
  }
}

export function generateEmptySeasonStats(): PlayerSeasonStats {
  return {
    goalsScored: 0,
    assists: 0,
    yellowCards: 0,
    redCards: 0,
    matchesPlayed: 0,
    cleanSheets: 0,
  };
}

export function developPlayer(player: Player): Player {
  let statGrowth = 0;
  if (player.age >= 18 && player.age <= 21) {
    statGrowth = 0.3;
  } else if (player.age > 30) {
    statGrowth = -0.5; // Natural decline
  }
  
  return {
    ...player,
    age: player.age + 1,
    rating: Math.max(50, Math.min(99, player.rating + statGrowth))
  };
}
