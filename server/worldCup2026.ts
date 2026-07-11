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
  oddsSource?: 'espn' | 'polymarket' | 'model' | 'external';
  polymarket?: {
    marketId: string;
    question: string;
    slug?: string;
    url?: string;
    prices: {
      home?: number;
      draw?: number;
      away?: number;
    };
    updatedAt?: string;
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

type PolymarketMarket = {
  id?: string;
  question?: string;
  slug?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  updatedAt?: string;
  volumeNum?: number;
  liquidityNum?: number;
};

const teamAliases: Record<string, string[]> = {
  'United States': ['USA', 'USMNT'],
  'Korea Republic': ['South Korea'],
  'IR Iran': ['Iran'],
  Turkey: ['Turkiye'],
};

let polymarketCache: {key: string; expiresAt: number; value: Map<string, WorldCupMatch['polymarket']>} | null = null;

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function candidateNames(team: string) {
  return [team, ...(teamAliases[team] || [])].map(normalizeName);
}

function parseJsonList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value !== 'string') return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function probabilityToDecimal(value: number | undefined) {
  if (!value || value <= 0.01 || value >= 0.99) return undefined;
  return Math.round((1 / value) * 100) / 100;
}

function matchOutcomePrice(outcomes: string[], prices: string[], names: string[]) {
  const index = outcomes.findIndex((outcome) => {
    const normalized = normalizeName(outcome);
    return names.some((name) => normalized.includes(name) || name.includes(normalized));
  });
  if (index < 0) return undefined;
  const price = Number(prices[index]);
  return Number.isFinite(price) ? price : undefined;
}

function extractPolymarket(match: WorldCupMatch, market: PolymarketMarket): WorldCupMatch['polymarket'] | null {
  const question = market.question || '';
  const normalizedQuestion = normalizeName(question);
  const homeNames = candidateNames(match.home);
  const awayNames = candidateNames(match.away);
  if (!homeNames.some((name) => normalizedQuestion.includes(name))) return null;
  if (!awayNames.some((name) => normalizedQuestion.includes(name))) return null;

  const outcomes = parseJsonList(market.outcomes);
  const prices = parseJsonList(market.outcomePrices);
  const home = matchOutcomePrice(outcomes, prices, homeNames);
  const away = matchOutcomePrice(outcomes, prices, awayNames);
  const draw = matchOutcomePrice(outcomes, prices, ['draw', 'tie']);
  if (!home && !away && !draw) return null;

  return {
    marketId: market.id || '',
    question,
    slug: market.slug,
    url: market.slug ? `https://polymarket.com/market/${market.slug}` : undefined,
    prices: {home, draw, away},
    updatedAt: market.updatedAt,
  };
}

async function fetchPolymarketForMatches(matches: WorldCupMatch[]) {
  if (process.env.WORLD_CUP_2026_DISABLE_POLYMARKET === 'true') return new Map<string, WorldCupMatch['polymarket']>();
  const upcoming = matches
    .filter((match) => match.status !== 'FT' && !match.home.includes('Winner') && !match.away.includes('Winner'))
    .sort((a, b) => Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc))
    .slice(0, 10);
  const key = upcoming.map((match) => `${match.id}:${match.home}:${match.away}`).join('|');
  if (polymarketCache?.key === key && polymarketCache.expiresAt > Date.now()) return polymarketCache.value;

  const baseUrl = process.env.POLYMARKET_GAMMA_URL || 'https://gamma-api.polymarket.com/markets';
  const entries = await Promise.allSettled(upcoming.map(async (match) => {
    const searches = [
      `${match.home} ${match.away}`,
      `${match.home} vs ${match.away}`,
      `World Cup ${match.home} ${match.away}`,
    ];
    for (const search of searches) {
      const url = new URL(baseUrl);
      url.searchParams.set('active', 'true');
      url.searchParams.set('closed', 'false');
      url.searchParams.set('limit', '20');
      url.searchParams.set('search', search);
      const response = await fetch(url, {headers: {accept: 'application/json'}, cache: 'no-store'});
      if (!response.ok) continue;
      const body = await response.json() as PolymarketMarket[];
      const markets = Array.isArray(body) ? body : [];
      const ranked = markets.sort((a, b) => (b.liquidityNum || b.volumeNum || 0) - (a.liquidityNum || a.volumeNum || 0));
      for (const market of ranked) {
        const parsed = extractPolymarket(match, market);
        if (parsed) return [match.id, parsed] as const;
      }
    }
    return [match.id, undefined] as const;
  }));

  const value = new Map<string, WorldCupMatch['polymarket']>();
  for (const entry of entries) {
    if (entry.status === 'fulfilled' && entry.value[1]) value.set(entry.value[0], entry.value[1]);
  }
  polymarketCache = {key, value, expiresAt: Date.now() + 30_000};
  return value;
}

function applyPolymarketOdds(matches: WorldCupMatch[], markets: Map<string, WorldCupMatch['polymarket']>) {
  return matches.map((match) => {
    const polymarket = markets.get(match.id);
    if (!polymarket) return match;
    return {
      ...match,
      odds: {
        home: probabilityToDecimal(polymarket.prices.home) || match.odds.home,
        draw: probabilityToDecimal(polymarket.prices.draw) || match.odds.draw,
        away: probabilityToDecimal(polymarket.prices.away) || match.odds.away,
      },
      oddsSource: 'polymarket' as const,
      polymarket,
    };
  });
}

function withLiveState(match: Omit<WorldCupMatch, 'status' | 'minute' | 'homeScore' | 'awayScore' | 'marketOpen' | 'source'>, now: Date): WorldCupMatch {
  const kickoffMs = Date.parse(match.kickoffUtc);
  const elapsedMinutes = Math.floor((now.getTime() - kickoffMs) / 60_000);
  if (elapsedMinutes < 0) {
    return {...match, status: 'SCHEDULED', marketOpen: true, source: 'fallback', oddsSource: 'model'};
  }
  if (elapsedMinutes <= 105) {
    const minute = Math.min(90, Math.max(1, elapsedMinutes));
    return {...match, status: 'LIVE', minute, ...scoreFromClock(match.id, minute), marketOpen: true, source: 'fallback', oddsSource: 'model'};
  }
  return {...match, status: 'FT', minute: 90, ...scoreFromClock(match.id, 90), marketOpen: false, source: 'fallback', oddsSource: 'model'};
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
      oddsSource: competition ? 'espn' : 'model',
      marketOpen: status !== 'FT',
      source: 'espn',
    };
  });
}

export async function getWorldCupLiveMatches(now = new Date()) {
  try {
    const external = await fetchExternalMatches();
    if (external) return {source: 'external', updatedAt: now.toISOString(), matches: external.map((match) => ({...match, oddsSource: match.oddsSource || 'external'}))};
  } catch (error) {
    console.warn('Custom World Cup 2026 feed failed:', error);
  }
  try {
    const espn = await fetchEspnMatches(now);
    if (espn?.length) {
      const polymarket = await fetchPolymarketForMatches(espn);
      return {source: 'espn', updatedAt: now.toISOString(), matches: applyPolymarketOdds(espn, polymarket)};
    }
  } catch (error) {
    console.warn('ESPN World Cup 2026 feed failed:', error);
  }
  const fallback = fallbackMatches.map((match) => withLiveState(match, now));
  try {
    const polymarket = await fetchPolymarketForMatches(fallback);
    return {
      source: 'fallback',
      updatedAt: now.toISOString(),
      matches: applyPolymarketOdds(fallback, polymarket),
    };
  } catch (error) {
    console.warn('Polymarket World Cup 2026 odds overlay failed:', error);
  }
  return {
    source: 'fallback',
    updatedAt: now.toISOString(),
    matches: fallback,
  };
}
