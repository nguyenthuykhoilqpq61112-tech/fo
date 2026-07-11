export type WorldCupMatchStatus = 'SCHEDULED' | 'LIVE' | 'FT';
export type WorldCupDataSource = 'fallback' | 'external' | 'espn';

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
  source: WorldCupDataSource;
}

const fallbackMatches: Omit<WorldCupMatch, 'status' | 'minute' | 'homeScore' | 'awayScore' | 'marketOpen' | 'source'>[] = [
  {
    id: '760510',
    stage: 'Quarter-final',
    home: 'France',
    away: 'Morocco',
    venue: 'Gillette Stadium',
    city: 'Boston / Foxborough',
    kickoffUtc: '2026-07-09T20:00:00.000Z',
    odds: {home: 1.72, draw: 3.45, away: 5.2},
  },
  {
    id: '760511',
    stage: 'Quarter-final',
    home: 'Spain',
    away: 'Belgium',
    venue: 'SoFi Stadium',
    city: 'Inglewood',
    kickoffUtc: '2026-07-10T19:00:00.000Z',
    odds: {home: 1.95, draw: 3.2, away: 4.1},
  },
  {
    id: '760512',
    stage: 'Quarter-final',
    home: 'Norway',
    away: 'England',
    venue: 'Hard Rock Stadium',
    city: 'Miami',
    kickoffUtc: '2026-07-11T21:00:00.000Z',
    odds: {home: 4.0, draw: 3.65, away: 1.91},
  },
  {
    id: '760513',
    stage: 'Quarter-final',
    home: 'Argentina',
    away: 'Switzerland',
    venue: 'Arrowhead Stadium',
    city: 'Kansas City',
    kickoffUtc: '2026-07-12T01:00:00.000Z',
    odds: {home: 1.69, draw: 3.55, away: 5.5},
  },
  {
    id: '760514',
    stage: 'Semi-final',
    home: 'France',
    away: 'Spain',
    venue: 'AT&T Stadium',
    city: 'Arlington',
    kickoffUtc: '2026-07-14T19:00:00.000Z',
    odds: {home: 2.3, draw: 3.25, away: 3.2},
  },
  {
    id: '760515',
    stage: 'Semi-final',
    home: 'Quarterfinal 3 Winner',
    away: 'Quarterfinal 4 Winner',
    venue: 'Mercedes-Benz Stadium',
    city: 'Atlanta',
    kickoffUtc: '2026-07-15T19:00:00.000Z',
    odds: {home: 2.35, draw: 3.15, away: 3.2},
  },
  {
    id: '760516',
    stage: 'Third-place match',
    home: 'Semifinal 1 Loser',
    away: 'Semifinal 2 Loser',
    venue: 'Hard Rock Stadium',
    city: 'Miami',
    kickoffUtc: '2026-07-18T21:00:00.000Z',
    odds: {home: 2.5, draw: 3.2, away: 2.85},
  },
  {
    id: '760517',
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

function americanToDecimal(value: unknown) {
  const raw = typeof value === 'number' ? value : Number(String(value || '').replace(/[^\d+-]/g, ''));
  if (!Number.isFinite(raw) || raw === 0) return null;
  return raw > 0 ? Math.round((1 + raw / 100) * 100) / 100 : Math.round((1 + 100 / Math.abs(raw)) * 100) / 100;
}

function seededOdds(id: string) {
  const seed = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return {
    home: Math.round((1.65 + (seed % 140) / 100) * 100) / 100,
    draw: Math.round((3.05 + (seed % 55) / 100) * 100) / 100,
    away: Math.round((1.75 + ((seed >> 2) % 170) / 100) * 100) / 100,
  };
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

type EspnEvent = {
  id: string;
  date: string;
  season?: {slug?: string};
  status?: {
    clock?: number;
    displayClock?: string;
    type?: {state?: string; completed?: boolean; detail?: string; shortDetail?: string};
  };
  competitions?: Array<{
    date?: string;
    startDate?: string;
    altGameNote?: string;
    status?: EspnEvent['status'];
    venue?: {fullName?: string; address?: {city?: string; state?: string; country?: string}};
    competitors?: Array<{
      homeAway?: string;
      score?: string;
      team?: {displayName?: string; shortDisplayName?: string; name?: string};
    }>;
    odds?: Array<{
      moneyline?: {
        home?: {close?: {odds?: string}; open?: {odds?: string}};
        draw?: {close?: {odds?: string}; open?: {odds?: string}};
        away?: {close?: {odds?: string}; open?: {odds?: string}};
      };
    } | null>;
  }>;
};

function stageLabel(event: EspnEvent, competition: NonNullable<EspnEvent['competitions']>[number]) {
  const note = competition.altGameNote?.replace(/^FIFA World Cup,\s*/i, '').trim();
  if (note) return note;
  return (event.season?.slug || 'FIFA World Cup').replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function eventStatus(event: EspnEvent, competition: NonNullable<EspnEvent['competitions']>[number]): WorldCupMatchStatus {
  const state = competition.status?.type?.state || event.status?.type?.state;
  const completed = competition.status?.type?.completed || event.status?.type?.completed;
  if (completed || state === 'post') return 'FT';
  if (state === 'in') return 'LIVE';
  return 'SCHEDULED';
}

function eventMinute(event: EspnEvent, competition: NonNullable<EspnEvent['competitions']>[number]) {
  const status = competition.status || event.status;
  if (typeof status?.clock === 'number' && status.clock > 0) return Math.min(120, Math.max(1, Math.ceil(status.clock / 60)));
  const display = status?.displayClock || status?.type?.detail || status?.type?.shortDetail || '';
  const match = display.match(/(\d+)/);
  return match ? Number(match[1]) : undefined;
}

function eventOdds(event: EspnEvent, competition: NonNullable<EspnEvent['competitions']>[number]) {
  const moneyline = competition.odds?.find(Boolean)?.moneyline;
  const home = americanToDecimal(moneyline?.home?.close?.odds || moneyline?.home?.open?.odds);
  const draw = americanToDecimal(moneyline?.draw?.close?.odds || moneyline?.draw?.open?.odds);
  const away = americanToDecimal(moneyline?.away?.close?.odds || moneyline?.away?.open?.odds);
  if (home && draw && away) return {home, draw, away};
  return seededOdds(event.id);
}

function espnDateRanges(now: Date) {
  const explicit = process.env.WORLD_CUP_2026_ESPN_DATES;
  if (explicit) return explicit.split(',').map((range) => range.trim()).filter(Boolean);
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - 2);
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() + 8);
  const fmt = (date: Date) => date.toISOString().slice(0, 10).replace(/-/g, '');
  return [
    '20260611-20260801',
    `${fmt(start)}-${fmt(end)}`,
    '20260709-20260719',
  ];
}

async function fetchEspnMatches(now: Date): Promise<WorldCupMatch[] | null> {
  if (process.env.WORLD_CUP_2026_DISABLE_ESPN === 'true') return null;
  const baseUrl = process.env.WORLD_CUP_2026_ESPN_URL || 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';
  const events = new Map<string, EspnEvent>();
  for (const dateRange of espnDateRanges(now)) {
    const url = new URL(baseUrl);
    if (!url.searchParams.has('dates')) url.searchParams.set('dates', dateRange);
    const response = await fetch(url, {headers: {accept: 'application/json'}, cache: 'no-store'});
    if (!response.ok) throw new Error(`ESPN World Cup feed failed with ${response.status}`);
    const body = await response.json() as {events?: EspnEvent[]};
    if (!Array.isArray(body.events)) throw new Error('ESPN World Cup feed did not return events');
    for (const event of body.events) events.set(event.id, event);
  }
  return [...events.values()].map((event) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors || [];
    const home = competitors.find((competitor) => competitor.homeAway === 'home') || competitors[0];
    const away = competitors.find((competitor) => competitor.homeAway === 'away') || competitors[1];
    const status = competition ? eventStatus(event, competition) : 'SCHEDULED';
    const minute = competition ? eventMinute(event, competition) : undefined;
    const venue = competition?.venue;
    return {
      id: event.id,
      stage: competition ? stageLabel(event, competition) : 'FIFA World Cup',
      home: home?.team?.displayName || home?.team?.shortDisplayName || home?.team?.name || 'TBD',
      away: away?.team?.displayName || away?.team?.shortDisplayName || away?.team?.name || 'TBD',
      venue: venue?.fullName || 'TBD',
      city: [venue?.address?.city, venue?.address?.state || venue?.address?.country].filter(Boolean).join(', ') || 'TBD',
      kickoffUtc: new Date(competition?.date || competition?.startDate || event.date).toISOString(),
      status,
      ...(minute ? {minute} : {}),
      ...(status !== 'SCHEDULED' ? {homeScore: Number(home?.score || 0), awayScore: Number(away?.score || 0)} : {}),
      odds: competition ? eventOdds(event, competition) : seededOdds(event.id),
      marketOpen: status !== 'FT',
      source: 'espn',
    };
  });
}

export async function getWorldCupLiveMatches(now = new Date()) {
  try {
    const external = await fetchExternalMatches();
    if (external) return {source: 'external', updatedAt: now.toISOString(), matches: external};
  } catch (error) {
    console.warn('Custom World Cup 2026 feed failed:', error);
  }
  try {
    const espn = await fetchEspnMatches(now);
    if (espn?.length) return {source: 'espn', updatedAt: now.toISOString(), matches: espn};
  } catch (error) {
    console.warn('ESPN World Cup 2026 feed failed:', error);
  }
  return {
    source: 'fallback',
    updatedAt: now.toISOString(),
    matches: fallbackMatches.map((match) => withLiveState(match, now)),
  };
}
