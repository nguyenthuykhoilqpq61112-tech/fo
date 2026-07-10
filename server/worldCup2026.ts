export type WorldCupMatchStatus = 'SCHEDULED' | 'LIVE' | 'FT';

export interface WorldCupMatch {
  id: string;
  stage: string;
  home: string;
  away: string;
  venue: string;
  city: string;
  kickoffUtc: string;
  status: WorldCupMatchStatus;
  minute?: number;
  homeScore?: number;
  awayScore?: number;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
  marketOpen: boolean;
  source: 'fallback' | 'external';
}

const fallbackMatches: Omit<WorldCupMatch, 'status' | 'minute' | 'homeScore' | 'awayScore' | 'marketOpen' | 'source'>[] = [
  {
    id: 'wc26-qf-france-morocco',
    stage: 'Quarter-final',
    home: 'France',
    away: 'Morocco',
    venue: 'Gillette Stadium',
    city: 'Boston / Foxborough',
    kickoffUtc: '2026-07-09T20:00:00.000Z',
    odds: {home: 1.72, draw: 3.45, away: 5.2},
  },
  {
    id: 'wc26-qf-england-norway',
    stage: 'Quarter-final',
    home: 'England',
    away: 'Norway',
    venue: 'Hard Rock Stadium',
    city: 'Miami',
    kickoffUtc: '2026-07-11T21:00:00.000Z',
    odds: {home: 1.86, draw: 3.4, away: 4.7},
  },
  {
    id: 'wc26-qf-argentina-switzerland',
    stage: 'Quarter-final',
    home: 'Argentina',
    away: 'Switzerland',
    venue: 'Arrowhead Stadium',
    city: 'Kansas City',
    kickoffUtc: '2026-07-12T01:00:00.000Z',
    odds: {home: 1.64, draw: 3.8, away: 5.8},
  },
  {
    id: 'wc26-sf-1',
    stage: 'Semi-final',
    home: 'Quarter-final Winner 1',
    away: 'Quarter-final Winner 2',
    venue: 'AT&T Stadium',
    city: 'Dallas / Arlington',
    kickoffUtc: '2026-07-14T20:00:00.000Z',
    odds: {home: 2.42, draw: 3.1, away: 3.05},
  },
  {
    id: 'wc26-sf-2',
    stage: 'Semi-final',
    home: 'Quarter-final Winner 3',
    away: 'Quarter-final Winner 4',
    venue: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    kickoffUtc: '2026-07-15T20:00:00.000Z',
    odds: {home: 2.35, draw: 3.15, away: 3.2},
  },
  {
    id: 'wc26-final',
    stage: 'Final',
    home: 'Semi-final Winner 1',
    away: 'Semi-final Winner 2',
    venue: 'MetLife Stadium',
    city: 'New York / New Jersey',
    kickoffUtc: '2026-07-19T19:00:00.000Z',
    odds: {home: 2.5, draw: 3.0, away: 2.95},
  },
];

function scoreFromClock(id: string, minute: number) {
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const homeScore = minute > 18 ? Math.floor(((seed % 4) + minute / 37) % 4) : 0;
  const awayScore = minute > 31 ? Math.floor((((seed >> 2) % 3) + minute / 44) % 3) : 0;
  return {homeScore, awayScore};
}

function withLiveState(match: Omit<WorldCupMatch, 'status' | 'minute' | 'homeScore' | 'awayScore' | 'marketOpen' | 'source'>, now: Date): WorldCupMatch {
  const kickoffMs = Date.parse(match.kickoffUtc);
  const elapsedMinutes = Math.floor((now.getTime() - kickoffMs) / 60_000);
  if (elapsedMinutes < 0) {
    return {...match, status: 'SCHEDULED', marketOpen: true, source: 'fallback'};
  }
  if (elapsedMinutes <= 105) {
    const minute = Math.min(90, Math.max(1, elapsedMinutes));
    return {...match, status: 'LIVE', minute, ...scoreFromClock(match.id, minute), marketOpen: true, source: 'fallback'};
  }
  return {...match, status: 'FT', minute: 90, ...scoreFromClock(match.id, 90), marketOpen: false, source: 'fallback'};
}

async function fetchExternalMatches(): Promise<WorldCupMatch[] | null> {
  const feedUrl = process.env.WORLD_CUP_2026_FEED_URL;
  if (!feedUrl) return null;
  const response = await fetch(feedUrl, {headers: {accept: 'application/json'}});
  if (!response.ok) throw new Error(`World Cup feed failed with ${response.status}`);
  const body = await response.json() as {matches?: WorldCupMatch[]};
  if (!Array.isArray(body.matches)) throw new Error('World Cup feed must return { matches: [...] }');
  return body.matches.map((match) => ({...match, source: 'external'}));
}

export async function getWorldCupLiveMatches(now = new Date()) {
  try {
    const external = await fetchExternalMatches();
    if (external) return {source: 'external', updatedAt: now.toISOString(), matches: external};
  } catch (error) {
    console.warn('Falling back to bundled World Cup 2026 fixtures:', error);
  }
  return {
    source: 'fallback',
    updatedAt: now.toISOString(),
    matches: fallbackMatches.map((match) => withLiveState(match, now)),
  };
}
