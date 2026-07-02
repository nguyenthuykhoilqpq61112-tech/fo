import { Fixture } from "../types";

export interface HighlightMoment {
  minute: number;
  type: "GOAL" | "RED_CARD" | "PENALTY" | "MOTM";
  playerName: string;
  teamId: string;
  description: string; // e.g. "45' ⚽ Rashford fires home from 20 yards"
}

/**
 * Builds a chronological highlights reel for a finished fixture.
 * Includes goals, red cards, and (if available) the Man of the Match
 * as a closing moment.
 */
export function buildHighlightsReel(fixture: Fixture): HighlightMoment[] {
  const moments: HighlightMoment[] = [];

  fixture.events.forEach((ev) => {
    if (ev.type === "GOAL") {
      const isPenalty = /penalt/i.test(ev.commentary);
      moments.push({
        minute: ev.minute,
        type: isPenalty ? "PENALTY" : "GOAL",
        playerName: ev.playerName || "Unknown",
        teamId: ev.teamId || "",
        description:
          ev.commentary ||
          `${ev.minute}' ⚽ ${ev.playerName || "Unknown"} scores!`,
      });
    } else if (ev.type === "RED_CARD") {
      moments.push({
        minute: ev.minute,
        type: "RED_CARD",
        playerName: ev.playerName || "Unknown",
        teamId: ev.teamId || "",
        description:
          ev.commentary ||
          `${ev.minute}' 🟥 ${ev.playerName || "Unknown"} is sent off!`,
      });
    }
  });

  moments.sort((a, b) => a.minute - b.minute);

  if (fixture.motm) {
    moments.push({
      minute: 90,
      type: "MOTM",
      playerName: fixture.motm.playerName,
      teamId: fixture.motm.teamId,
      description: `⭐ Man of the Match: ${fixture.motm.playerName} (${fixture.motm.reason})`,
    });
  }

  return moments;
}
