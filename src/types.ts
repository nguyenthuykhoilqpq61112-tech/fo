export type Position = "GK" | "DEF" | "MID" | "ATT";

export interface PlayerAbilities {
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
  
  diving?: number;
  handling?: number;
  kicking?: number;
  reflexes?: number;
  speed?: number;
  positioning?: number;
}

export interface PlayerSeasonStats {
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  cleanSheets: number;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: Position;
  rating: number; // 50 - 99
  age: number;
  fatigue: number;
  injured: boolean;
  injuryRecoveryMatches: number;
  seasonStats: PlayerSeasonStats;
  goals: number;
  assists: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  abilities?: PlayerAbilities;
  injuredRounds?: number;
  suspendedRounds?: number;
}

export interface ClubOwnership {
  clubId: string;
  purchasedAt: number;
  purchasePrice: number;
  trainingFacilityLevel: number;
  stadiumLevel: number;
  totalInvested: number;
  passiveIncomePerMatch: number;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  rating: number; // 1 to 5 (stars or 60 to 95 average)
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
  wonMatches: number;
  drawnMatches: number;
  lostMatches: number;
  goalsScored: number;
  goalsConceded: number;
  morale: number;
  rivalClubIds: string[];
  ownership?: ClubOwnership;
}

export type FixtureStatus = "SCHEDULED" | "LIVE" | "FT";

export type MarketType =
  | "MATCH_WINNER"
  | "DOUBLE_CHANCE"
  | "OVER_UNDER_GOALS"
  | "BOTH_TEAMS_TO_SCORE"
  | "EXACT_SCORE"
  | "ANYTIME_GOALSCORER"
  | "OVER_UNDER_CORNERS"
  | "OVER_UNDER_CARDS"
  | "OVER_UNDER_SAVES";

export interface MatchStats {
  home: {
    shots: number;
    shotsOnTarget: number;
    passes: number;
    fouls: number;
    corners: number;
    saves: number;
    yellowCards: number;
    redCards: number;
  };
  away: {
    shots: number;
    shotsOnTarget: number;
    passes: number;
    fouls: number;
    corners: number;
    saves: number;
    yellowCards: number;
    redCards: number;
  };
}

export interface MatchEvent {
  minute: number;
  type: "GOAL" | "ASSIST" | "SAVE" | "YELLOW_CARD" | "RED_CARD" | "FOUL" | "MISS" | "KICKOFF" | "HALF_TIME" | "FULL_TIME" | "COMMENTARY";
  teamId?: string;
  playerId?: string;
  playerName?: string;
  assistantPlayerId?: string;
  assistantPlayerName?: string;
  commentary: string;
}

export interface GoalscorerOdds {
  playerId: string;
  name: string;
  position: Position;
  odds: number;
}

export interface MatchOdds {
  homeWin: number;
  draw: number;
  awayWin: number;
  exactScores: { score: string; odds: number }[];
  goalscorers: GoalscorerOdds[];
  doubleChance?: {
    homeOrDraw: number;
    homeOrAway: number;
    drawOrAway: number;
  };
  bothTeamsToScore?: {
    yes: number;
    no: number;
  };
  overUnder?: {
    over0_5: number;
    under0_5: number;
    over1_5: number;
    under1_5: number;
    over2_5: number;
    under2_5: number;
    over3_5: number;
    under3_5: number;
    over4_5: number;
    under4_5: number;
  };
  overUnderCorners?: {
    over: number;
    under: number;
    line: number;
  }[];
  overUnderCards?: {
    over: number;
    under: number;
    line: number;
  }[];
  overUnderSaves?: {
    over: number;
    under: number;
    line: number;
  }[];
}

export type WeatherCondition = 
  'Clear Sky' | 'Clear Skies' | 'Overcast' | 'Light Rain' | 'Heavy Rain' | 'Pouring Rain' |
  'Thunderstorm' | 'Snow' | 'Blizzard' | 'Heatwave' | 'Fierce Wind' | 'Fierce Derby';

export interface WeatherModifiers {
  condition: WeatherCondition;
  yellowCardMultiplier: number;
  goalProbabilityMultiplier: number;
  foulRateMultiplier: number;
  volatilityMultiplier: number;
  isRivalryDerby?: boolean;
}

export interface CardTracker {
  playerId: string;
  playerName: string;
  clubId: string;
  yellowCount: number;
  isRedCarded: boolean;
}

export interface Fixture {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  roundIndex: number; // 0 = R32, 1 = R16, 2 = QF, 3 = SF, 4 = Final
  status: FixtureStatus;
  homeScore: number;
  awayScore: number;
  stats: MatchStats;
  events: MatchEvent[];
  odds: MatchOdds;
  currentMinute: number;
  elapsedTicks: number; // For tick-by-tick monitoring
  penaltyScore?: string; // e.g. "4-3" or "5-4" or null when shootout is decided
  weather: WeatherCondition;
  weatherModifiers?: WeatherModifiers;
  cardTrackers?: CardTracker[];
}

export interface BetSelection {
  fixtureId: string;
  marketType: MarketType;
  selectionId: string; // "HOME" | "DRAW" | "AWAY" | exact score (e.g., "2-1") | playerId
  odds: number;
  details: string; // e.g., "Aston Villa Win", "Exact Score: 2-1", "Haaland Anytime"
  marketName: string; // e.g., "Match Winner", "Correct Score", "Anytime Goalscorer"
}

export interface BetTicket {
  id: string;
  type: "SINGLE" | "ACCUMULATOR";
  selections: BetSelection[];
  totalOdds: number;
  stake: number;
  potentialPayout: number;
  status: "PENDING" | "WON" | "LOST" | "VOID" | "CASHED_OUT";
  timestamp: number;
  // For single mode: maps selection key (fixtureId-marketType-selectionId) to individual stake
  selectionStakes?: { [selId: string]: number };
  cashedOutAmount?: number;
}

export interface Profile {
  username: string;
  balance: number;
  netProfit: number;
  tickets: BetTicket[];
  currentRoundIndex: number;
  createdTime: number;
  purchasedItems?: PurchasedItem[];
  bankrollHistory?: { timestamp: number; balance: number; detail: string }[];
}

export type ItemRarity = 'Common' | 'Rare' | 'Ultra Rare' | 'Legendary';
export type LuxuryCategory = 
  'Hypercars' | 'Private Aviation' | 'Superyachts' | 
  'Real Estate' | 'Watches' | 'Jewellery' | 
  'Fashion' | 'Fine Art' | 'Spirits' | 'Experiences' | 'Cars' | 'Jets' | 'Yachts' | 'Devices' | 'Businesses';

export interface LuxuryItem {
  id: string;
  name: string;
  price: number;
  category: LuxuryCategory;
  description: string;
  imageUrl: string;
  emoji?: string;
  rarity: ItemRarity;
  owned: boolean;
}

export interface PurchasedItem {
  id: string;
  name: string;
  description: string;
  price: number;
  worth: number; // what it is worth on cash-in
  icon: string;
  dateStr: string;
  imageUrl?: string;
  category?: LuxuryCategory;
  rarity?: ItemRarity;
}

export interface TipsterTip {
  matchId: string;
  content: string;
  tipType: 'injury_report' | 'morale_reveal' | 'value_bet' | 'derby_warning' | 'syndicate';
  timestamp: number;
}

export interface Tipster {
  id: string;
  name: string;
  avatar: string; // emoji
  bio: string;
  balance: number;
  accuracy: number; // percentage
  betsWon: number;
  betsTotal: number;
  riskProfile: "SAFE" | "BALANCED" | "AGGRESSIVE";
  recentTips: string[];
  specialty?: string;
  costPerMatchday?: number;
  isHired?: boolean;
  tipsThisMatchday?: TipsterTip[];
}

export interface AuctionListing {
  id: string;
  ticketId: string;
  legsWon: number;
  legsTotal: number;
  remainingOdds: number;
  stakePlaced: number;
  currentBid: number;
  bidder: string;
  roundsLeft: number;
  listedAt: number;
}

export interface ExchangeAsset {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  initialPrice: number;
  volatility: number;
  assetClass: 'crypto' | 'stock' | 'commodity';
  priceHistory: number[];
  userHolding: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalWon: number;
  totalWagered: number;
  biggestWin: number;
  roi: number;
  winRate: number;
  rank: number;
}

export type BetBuilderMarket = 
  'match_result' | 'btts' | 'total_goals' | 
  'first_scorer' | 'player_scorer' | 'total_cards' | 
  'total_corners' | 'home_clean_sheet' | 'away_clean_sheet';

export interface BetBuilderSelection {
  matchId: string;
  market: BetBuilderMarket;
  selection: string;
  rawOdds: number;
}
