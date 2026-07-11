import { useState, useEffect, useRef } from "react";
import {
  Team,
  Fixture,
  BetTicket,
  Profile,
  Tipster,
  TransferListing,
  BetBuilderSelection,
} from "./types";
import { Header } from "./components/Header";
import { BettingSlip } from "./components/BettingSlip";
import { LiveMatches } from "./components/LiveMatches";
import { FixturesOdds } from "./components/FixturesOdds";
import { MyBets } from "./components/MyBets";
import { TeamsList } from "./components/TeamsList";
import { Analytics } from "./components/Analytics";
import { TournamentBracket } from "./components/TournamentBracket";
import { Leaderboard } from "./components/Leaderboard";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { LeagueStandings } from "./components/LeagueStandings";
import { CasinoSuite } from "./components/CasinoSuite";
import { ClubManager } from "./components/ClubManager";
import { SocialFeed } from "./components/SocialFeed";
import { TransferMarket } from "./components/TransferMarket";
import { BetBuilder } from "./components/BetBuilder";
import { WalletModal } from "./components/modals/WalletModal";
import { WinnerCelebrationModal } from "./components/modals/WinnerCelebrationModal";
import { GlobalEntityPreviewModal } from "./components/modals/GlobalEntityPreviewModal";
import { OwnerRevenueModal } from "./components/modals/OwnerRevenueModal";
import { MatchHighlightsModal } from "./components/modals/MatchHighlightsModal";
import { WorldCupLiveHub } from "./components/WorldCupLiveHub";
import { WorldCupFixturesOdds } from "./components/WorldCupFixturesOdds";
import { WorldCupTournament } from "./components/WorldCupTournament";
import { WorldCupQuickBet, type WorldCupQuickSelection } from "./components/WorldCupQuickBet";
import {AdminPanel, AppFooter, BonusesPage, CompliancePage, FloatingChat, GeoConsent} from "./components/SiteUtilityPages";

const TAB_PATHS: Record<string, string> = {
  fixtures: "/fixtures",
  live: "/live",
  tournament: "/tournament",
  bets: "/bets",
  teams: "/teams",
  analytics: "/analytics",
  leaderboard: "/leaderboard",
  career: "/career",
  casino: "/casino",
  bonuses: "/bonuses",
  admin: "/admin",
  "fair-play": "/fair-play",
  "responsible-gaming": "/responsible-gaming",
  worldcup: "/worldcup",
  "worldcup-live": "/worldcup/live",
  "worldcup-fixtures": "/worldcup/fixtures",
  "worldcup-tournament": "/worldcup/tournament",
  "worldcup-quick-bet": "/worldcup/quick-bet",
  feed: "/feed",
  myclub: "/myclub",
  transfers: "/transfers",
};

function tabFromPath(pathname: string) {
  const path = pathname.replace(/\/+$/, "") || "/";
  switch (path) {
    case "/live":
      return "live";
    case "/tournament":
      return "tournament";
    case "/bets":
      return "bets";
    case "/teams":
      return "teams";
    case "/analytics":
      return "analytics";
    case "/leaderboard":
      return "leaderboard";
    case "/career":
      return "career";
    case "/casino":
      return "casino";
    case "/bonuses":
      return "bonuses";
    case "/admin":
      return "admin";
    case "/fair-play":
      return "fair-play";
    case "/responsible-gaming":
      return "responsible-gaming";
    case "/worldcup":
      return "worldcup";
    case "/worldcup/live":
      return "worldcup-live";
    case "/worldcup/fixtures":
      return "worldcup-fixtures";
    case "/worldcup/tournament":
      return "worldcup-tournament";
    case "/worldcup/quick-bet":
      return "worldcup-quick-bet";
    case "/feed":
      return "feed";
    case "/myclub":
      return "myclub";
    case "/transfers":
      return "transfers";
    case "/fixtures":
    default:
      return "fixtures";
  }
}

function pathForTab(tab: string) {
  return TAB_PATHS[tab] || "/fixtures";
}

import {
  initializeNewTournament,
  initializeNewLeague,
  ROUND_LABELS,
} from "./data/tournament";
import { INITIAL_TIPSTERS, generateTipsterBetsForRound } from "./data/tipsters";
import { getKeysForMode, persistStateToCache, isSaveCompatible } from "./utils/storage";
import { generateTransferListings, applyUserWinsToOwnedTeam } from "./engine/transferEngine";
import { useProfile } from "./hooks/useProfile";
import { useSimulation } from "./hooks/useSimulation";
import { useBetting } from "./hooks/useBetting";
import { buildHandleAdvanceRound } from "./hooks/useRoundAdvance";
import { useTransferMarket } from "./hooks/useTransferMarket";
import { useChallenges } from "./hooks/useChallenges";
import { Challenges } from "./components/Challenges";
import { CareerStats } from "./components/CareerStats";
import { loadCareerProfile } from "./utils/careerUtils";
import { CareerProfile } from "./types";
import { ToastContainer } from "./components/ui/Toast";
import { AuthSession, saveGameState } from "./api/serverApi";


export default function App({ authSession }: { authSession: AuthSession }) {
  const [activeSlot, setActiveSlot] = useState<number>(() =>
    parseInt(localStorage.getItem("fs_selected_game_slot") || "1"),
  );
  const [dummyUpdateSlot, setDummyUpdateSlot] = useState(0);
  const [gameMode, setGameMode] = useState<"TOURNAMENT" | "LEAGUE" | null>(() =>
    localStorage.getItem("fs_selected_game_mode") as "TOURNAMENT" | "LEAGUE" | null,
  );

  const [activeTab, _setActiveTab] = useState(() =>
    typeof window !== "undefined" ? tabFromPath(window.location.pathname) : "fixtures",
  );
  const [collapsedSlip, setCollapsedSlip] = useState(false);
  const [showWinnerCelebration, setShowWinnerCelebration] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [ownerRevenueReport, setOwnerRevenueReport] = useState<{
    revenue: number;
    fixtures: { fixtureId: string; baseIncome: number; bonus: number; result: "WIN" | "DRAW" | "LOSS"; scoreline: string }[];
    teamName: string;
  } | null>(null);
  const [betBuilderFixtureId, setBetBuilderFixtureId] = useState<string | null>(null);
  const [globalEntity, setGlobalEntity] = useState<{ type: "team" | "player"; id: string } | null>(null);
  const [showHighlightsFixture, setShowHighlightsFixture] = useState<Fixture | null>(null);
  const [careerProfile, setCareerProfile] = useState<CareerProfile>(() => loadCareerProfile());
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>(() =>
    localStorage.getItem("lastSelectedFixtureId") || "",
  );
  const [worldCupQuickSelection, setWorldCupQuickSelection] = useState<WorldCupQuickSelection | null>(null);

  const setActiveTab = (tab: string) => {
    _setActiveTab(tab);
    if (typeof window !== "undefined") {
      const nextPath = pathForTab(tab);
      if (window.location.pathname !== nextPath) window.history.pushState({tab}, "", nextPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => _setActiveTab(tabFromPath(window.location.pathname));
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [teams, setTeams] = useState<Team[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [tipsters, setTipsters] = useState<Tipster[]>([]);
  const [tipsterTickets, setTipsterTickets] = useState<{ [id: string]: BetTicket }>({});

  const profileHook = useProfile({
    gameMode, activeSlot, teams, setTeams, fixtures, tipsters, tipsterTickets,
  });
  const { userProfile, setUserProfile, persist } = profileHook;

  const { transferListings, setTransferListings, userBid, setUserBid,
    transferToast, handlePlaceUserBid, handleWithdrawBid, showTransferToast } =
    useTransferMarket(userProfile);

  const simHook = useSimulation({
    teams, userProfile, gameMode, activeSlot, fixtures, setFixtures, setActiveTab,
  });
  const { isSimulating, setIsSimulating, ticks, setTicks, simTimerRef } = simHook;

  const challengesHook = useChallenges({
    userProfile, setUserProfile, persist,
  });

  const bettingHook = useBetting({
    userProfile, setUserProfile, fixtures, teams, tipsters, tipsterTickets,
    gameMode, activeSlot, setCollapsedSlip,
  });
  const { selectedBets, setSelectedBets } = bettingHook;


  // Mirror the active save to the authenticated server database. localStorage remains
  // a fast offline cache, but the durable copy now lives behind the account API.
  useEffect(() => {
    if (!gameMode || !userProfile || teams.length === 0 || fixtures.length === 0) return;
    const timer = window.setTimeout(() => {
      saveGameState(gameMode, activeSlot, {
        profile: userProfile,
        teams,
        fixtures,
        tipsters,
        tipsterTickets,
      }).catch((err) => console.error("Failed to sync save to server", err));
    }, 600);
    return () => window.clearTimeout(timer);
  }, [gameMode, activeSlot, userProfile, teams, fixtures, tipsters, tipsterTickets]);

  // ─── Global entity modal events ────────────────────────────────────
  useEffect(() => {
    const handleOpenEntity = (e: Event) => {
      const ev = e as CustomEvent<{ type: "team" | "player"; id: string }>;
      if (ev.detail) setGlobalEntity(ev.detail);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGlobalEntity(null);
    };
    window.addEventListener("open-global-entity", handleOpenEntity);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("open-global-entity", handleOpenEntity);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ─── Highlights modal events ───────────────────────────────────────
  useEffect(() => {
    const handleOpenHighlights = (e: Event) => {
      const ev = e as CustomEvent<{ fixtureId: string }>;
      if (!ev.detail) return;
      const fx = fixtures.find(f => f.id === ev.detail.fixtureId);
      if (fx) setShowHighlightsFixture(fx);
    };
    window.addEventListener("open-highlights", handleOpenHighlights);
    return () => window.removeEventListener("open-highlights", handleOpenHighlights);
  }, [fixtures]);

  // Reload career stats whenever a season concludes
  useEffect(() => {
    if (showWinnerCelebration) setCareerProfile(loadCareerProfile());
  }, [showWinnerCelebration]);

  useEffect(() => {
    if (selectedFixtureId) localStorage.setItem("lastSelectedFixtureId", selectedFixtureId);
  }, [selectedFixtureId]);

  // ─── Load / initialise game state ──────────────────────────────────
  useEffect(() => {
    if (!gameMode) return;
    localStorage.setItem("fs_selected_game_mode", gameMode);
    const keys = getKeysForMode(gameMode, activeSlot);
    const cp = localStorage.getItem(keys.profile);
    const ct = localStorage.getItem(keys.teams);
    const cf = localStorage.getItem(keys.fixtures);
    const cs = localStorage.getItem(keys.tipsters);
    const ck = localStorage.getItem(keys.tipsterTickets);

    if (cp && ct && cf && cs && isSaveCompatible(keys)) {
      try {
        const parsedProfile: Profile = JSON.parse(cp);
        const parsedTeams: Team[] = JSON.parse(ct);
        const parsedFixtures: Fixture[] = JSON.parse(cf);
        const parsedTipsters: Tipster[] = JSON.parse(cs);
        const parsedTickets = ck ? JSON.parse(ck) : {};
        setUserProfile(parsedProfile);
        setTeams(parsedTeams);
        setFixtures(parsedFixtures);
        setTipsters(parsedTipsters);
        setTipsterTickets(parsedTickets);
        const activeRound = parsedFixtures.filter(f => f.roundIndex === parsedProfile.currentRoundIndex);
        const live = activeRound.filter(f => f.status === "LIVE");
        if (live.length > 0) { setTicks(live[0].elapsedTicks); setActiveTab("live"); }
        else if (activeRound.length > 0 && activeRound.every(f => f.status === "FT")) { setTicks(15); setActiveTab("live"); }
        else { setTicks(0); setActiveTab("fixtures"); }
      } catch { handleResetAndGenerate(); }
    } else { handleResetAndGenerate(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameMode]);

  // Sync selectedFixtureId to valid fixture
  useEffect(() => {
    if (!userProfile || fixtures.length === 0) return;
    const roundFixtures = fixtures.filter(f => f.roundIndex === userProfile.currentRoundIndex);
    if (roundFixtures.length === 0) return;
    const isValid = roundFixtures.some(f => f.id === selectedFixtureId);
    if (!isValid) {
      const first = roundFixtures.find(f => f.status !== "FT") || roundFixtures[0];
      setSelectedFixtureId(first.id);
    }
  }, [userProfile?.currentRoundIndex, fixtures, selectedFixtureId]);

  // Bankroll history tracker
  useEffect(() => {
    if (!userProfile) return;
    const history = userProfile.bankrollHistory || [];
    const lastBal = history.length > 0 ? history[history.length - 1].balance : null;
    if (lastBal === null || Math.abs(userProfile.balance - lastBal) > 0.01) {
      setUserProfile(prev => {
        if (!prev) return prev;
        return { ...prev, bankrollHistory: [...(prev.bankrollHistory || []), { timestamp: Date.now(), balance: prev.balance, detail: "Update" }] };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.balance]);

  // ─── Reset / new campaign helpers ──────────────────────────────────
  const handleResetAndGenerate = (keepRecords = false) => {
    if (!gameMode) return;
    const { teams: newTeams, fixtures: newFixtures } =
      gameMode === "TOURNAMENT" ? initializeNewTournament() : initializeNewLeague();
    const initialProfile: Profile = {
      username: userProfile?.username || authSession.user.username || "Tobi",
      balance: keepRecords ? (userProfile?.balance ?? 1000) : 1000,
      netProfit: keepRecords ? (userProfile?.netProfit ?? 0) : 0,
      tickets: keepRecords ? (userProfile?.tickets ?? []) : [],
      currentRoundIndex: 0,
      createdTime: keepRecords ? (userProfile?.createdTime ?? Date.now()) : Date.now(),
    };
    const ts = [...INITIAL_TIPSTERS];
    const tk = generateTipsterBetsForRound(ts, newFixtures, newTeams);
    persistStateToCache(gameMode, activeSlot, initialProfile, newTeams, newFixtures, ts, tk);
    setUserProfile(initialProfile);
    setTeams(newTeams);
    setFixtures(newFixtures);
    setTipsters(ts);
    setTipsterTickets(tk);
    setSelectedBets([]);
    setTicks(0);
    setIsSimulating(false);
    setShowWinnerCelebration(false);
    setTransferListings([]);
    setUserBid(null);
    setActiveTab("fixtures");
    if (simTimerRef.current) clearInterval(simTimerRef.current);
  };

  const handleStartNewCampaign = (
    username: string,
    startingBalance: number,
    mode: "TOURNAMENT" | "LEAGUE",
    slot: number,
    initialTab = "fixtures",
  ) => {
    setActiveSlot(slot);
    localStorage.setItem("fs_selected_game_slot", String(slot));
    const { teams: newTeams, fixtures: newFixtures } =
      mode === "TOURNAMENT" ? initializeNewTournament() : initializeNewLeague();
    const initialProfile: Profile = { username: username || authSession.user.username, balance: startingBalance, netProfit: 0, tickets: [], currentRoundIndex: 0, createdTime: Date.now() };
    const ts = [...INITIAL_TIPSTERS];
    const tk = generateTipsterBetsForRound(ts, newFixtures, newTeams);
    const keys = getKeysForMode(mode, slot);
    localStorage.setItem(keys.profile, JSON.stringify(initialProfile));
    localStorage.setItem(keys.teams, JSON.stringify(newTeams));
    localStorage.setItem(keys.fixtures, JSON.stringify(newFixtures));
    localStorage.setItem(keys.tipsters, JSON.stringify(ts));
    localStorage.setItem(keys.tipsterTickets, JSON.stringify(tk));
    localStorage.setItem("fs_selected_game_mode", mode);
    setGameMode(mode);
    setUserProfile(initialProfile);
    setTeams(newTeams);
    setFixtures(newFixtures);
    setTipsters(ts);
    setTipsterTickets(tk);
    setSelectedBets([]);
    setTicks(0);
    setIsSimulating(false);
    setShowWinnerCelebration(false);
    setTransferListings([]);
    setUserBid(null);
    setActiveTab(initialTab);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
  };

  const exitToMenu = () => {
    localStorage.removeItem("fs_selected_game_mode");
    setGameMode(null);
    setUserProfile(null);
    setTeams([]);
    setFixtures([]);
    setTipsters([]);
    setTipsterTickets({});
    setSelectedBets([]);
    if (typeof window !== "undefined") window.history.replaceState({}, "", "/");
  };

  // ─── Generate transfer listings at round start ──────────────────────
  useEffect(() => {
    if (!userProfile || teams.length === 0) return;
    const currentListings = generateTransferListings(teams, userProfile.currentRoundIndex, transferListings);
    setTransferListings(currentListings);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.currentRoundIndex]);

  // ─── Apply user transfer wins to owned team ─────────────────────────
  const applyTransferWinsToTeam = (
    resolvedListings: TransferListing[],
    currentTeams: Team[],
    ownedTeamId: string,
    pricePaid: number,
  ) => {
    const updated = applyUserWinsToOwnedTeam(currentTeams, resolvedListings, ownedTeamId);
    setTeams(updated);
    if (userProfile) {
      const nextProfile = { ...userProfile, balance: userProfile.balance - pricePaid };
      setUserProfile(nextProfile);
      persist(nextProfile, updated);
    }
  };
  void applyTransferWinsToTeam;


  // ─── Bet Builder placement ────────────────────────────────────────
  const handleBBPlace = async (sels: BetBuilderSelection[], stake: number, odds: number) => {
    if (!betBuilderFixtureId) return;
    if (await bettingHook.handlePlaceBetBuilder(betBuilderFixtureId, sels, stake, odds)) {
      setBetBuilderFixtureId(null);
    }
  };

    // ─── Build handleAdvanceRound ───────────────────────────────────────
  const handleAdvanceRound = buildHandleAdvanceRound({
    gameMode, activeSlot, userProfile, teams, fixtures, tipsters, tipsterTickets,
    isSimulating, transferListings, userBid,
    setUserProfile, setTeams, setFixtures, setTipsters, setTipsterTickets,
    setSelectedBets, setTicks, setActiveTab, setShowWinnerCelebration,
    setOwnerRevenueReport, setTransferListings, setUserBid,
    onTransferToast: showTransferToast,
  });

  // ─── Champion name ──────────────────────────────────────────────────
  const getChampion = (): { name: string; crest: Team } => {
    if (!teams.length) return { name: "Champion", crest: teams[0] };
    if (gameMode === "LEAGUE") {
      const sorted = [...teams].sort((a, b) => {
        const pa = a.wonMatches * 3 + a.drawnMatches;
        const pb = b.wonMatches * 3 + b.drawnMatches;
        if (pb !== pa) return pb - pa;
        const da = a.goalsScored - a.goalsConceded;
        const db = b.goalsScored - b.goalsConceded;
        return db !== da ? db - da : b.goalsScored - a.goalsScored;
      });
      return { name: sorted[0].name, crest: sorted[0] };
    }
    const fin = fixtures.find(f => f.roundIndex === 4 && f.status === "FT") || fixtures.find(f => f.roundIndex === 4);
    if (!fin) return { name: "Champion", crest: teams[0] };
    const winnerId = fin.homeScore > fin.awayScore ? fin.homeTeamId : fin.awayTeamId;
    const club = teams.find(t => t.id === winnerId) || teams[0];
    return { name: club.name, crest: club };
  };

  const currentRoundLabel =
    gameMode === "LEAGUE"
      ? `Matchday ${(userProfile?.currentRoundIndex ?? 0) + 1}`
      : ROUND_LABELS[userProfile?.currentRoundIndex || 0] || "Session Concluded";

  if (activeTab === "admin") {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#0f1115] text-slate-100 font-sans">
        <div className="flex h-full">
          <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-[#090b0f] p-5 md:block">
            <div className="text-xs font-black uppercase tracking-widest text-emerald-300">win-worldcup</div>
            <div className="mt-1 text-lg font-black text-white">Admin Back Office</div>
            <nav className="mt-8 space-y-2 text-sm">
              {["Users", "Deposits", "Withdrawals", "Risk Review", "Bonus Controls"].map((item) => (
                <div key={item} className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-slate-300">
                  {item}
                </div>
              ))}
            </nav>
          </aside>
          <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#11141a] px-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Private route</div>
                <h1 className="text-base font-black text-white">Operations dashboard</h1>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300">
                {authSession.user.username}
              </div>
            </header>
            <AdminPanel username={authSession.user.username} />
          </main>
        </div>
      </div>
    );
  }

  // ─── Welcome screen ─────────────────────────────────────────────────
  if (!gameMode || !userProfile) {
    const savedTournaments = [
      localStorage.getItem("fs_profile_v3_tournament_slot1") !== null || localStorage.getItem("fs_profile_v3_tournament") !== null,
      localStorage.getItem("fs_profile_v3_tournament_slot2") !== null,
      localStorage.getItem("fs_profile_v3_tournament_slot3") !== null,
    ];
    const savedLeagues = [
      localStorage.getItem("fs_profile_v3_league_slot1") !== null || localStorage.getItem("fs_profile_v3_league") !== null,
      localStorage.getItem("fs_profile_v3_league_slot2") !== null,
      localStorage.getItem("fs_profile_v3_league_slot3") !== null,
    ];

    const handleResumeCampaign = (mode: "TOURNAMENT" | "LEAGUE", slot: number) => {
      const keys = getKeysForMode(mode, slot);
      if (slot === 1 && localStorage.getItem(keys.profile) === null) {
        const m = mode.toLowerCase();
        ["profile","teams","fixtures","tipsters","tipsterTickets"].forEach((k) => {
          const old = localStorage.getItem(`fs_${k === "tipsterTickets" ? "tipster_tickets" : k}_v3_${m}`);
          if (old) localStorage.setItem((keys as Record<string, string>)[k], old);
        });
      }
      setActiveSlot(slot);
      localStorage.setItem("fs_selected_game_slot", String(slot));
      setGameMode(mode);
    };

    const handleDeleteSave = (mode: "TOURNAMENT" | "LEAGUE", slot: number) => {
      const keys = getKeysForMode(mode, slot);
      Object.values(keys).forEach(k => localStorage.removeItem(k));
      if (slot === 1) {
        const m = mode.toLowerCase();
        ["profile","teams","fixtures","tipsters","tipster_tickets"].forEach((k) =>
          localStorage.removeItem(`fs_${k}_v3_${m}`)
        );
      }
      setDummyUpdateSlot(p => p + 1);
    };

    void dummyUpdateSlot;

    return (
      <WelcomeScreen
        onKickoff={handleStartNewCampaign}
        onQuickBet={(username, startingBalance, mode, slot) => handleStartNewCampaign(username, startingBalance, mode, slot, "worldcup-quick-bet")}
        onEnterPage={(username, startingBalance, mode, slot, tab) => handleStartNewCampaign(username, startingBalance, mode, slot, tab)}
        savedTournaments={savedTournaments}
        savedLeagues={savedLeagues}
        resumeActiveMode={handleResumeCampaign}
        onDeleteSave={handleDeleteSave}
      />
    );
  }

  const champion = getChampion();

  return (
    <div id="app" className="h-screen w-screen bg-gradient-to-br from-[#0b0e14] via-[#05070a] to-[#121620] text-slate-100 flex flex-col overflow-hidden font-sans animate-fade-in">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        username={userProfile.username}
        balance={userProfile.balance}
        addFunds={() => setShowWalletModal(true)}
        resetTournament={handleResetAndGenerate}
        currentRoundLabel={currentRoundLabel}
        gameMode={gameMode}
        exitToMenu={exitToMenu}
        hasOwnedClub={!!userProfile.ownedTeamId}
      />

      <div id="workspace-split" className="flex flex-1 min-h-0 overflow-hidden relative">
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-transparent">
          {(activeTab === "worldcup" || activeTab === "worldcup-live") && <WorldCupLiveHub />}
          {activeTab === "worldcup-fixtures" && (
            <WorldCupFixturesOdds
              onQuickBetSelection={(selection) => {
                setWorldCupQuickSelection(selection);
                setActiveTab("worldcup-quick-bet");
              }}
            />
          )}
          {activeTab === "worldcup-tournament" && <WorldCupTournament />}
          {activeTab === "worldcup-quick-bet" && (
            <WorldCupQuickBet
              initialSelection={worldCupQuickSelection}
              onInitialSelectionConsumed={() => setWorldCupQuickSelection(null)}
            />
          )}
          {activeTab === "live" && (
            <LiveMatches
              fixtures={fixtures} teams={teams}
              roundIndex={userProfile.currentRoundIndex}
              currentRoundLabel={currentRoundLabel}
              isSimulating={isSimulating}
              onStartSimulation={simHook.handleStartSimulation}
              onPauseSimulation={simHook.handlePauseSimulation}
              onSimulateTick={simHook.handleSimulateTick}
              onSimulateInstant={simHook.handleSimulateInstant}
              onSimulateRemainingInstant={simHook.handleSimulateRemainingInstant}
              onAdvanceRound={handleAdvanceRound}
              ticks={ticks} selectedFixtureId={selectedFixtureId}
              setSelectedFixtureId={setSelectedFixtureId}
              selectedBets={selectedBets}
              onAddBetSelection={bettingHook.handleAddBetSelection}
              onRemoveSelection={bettingHook.handleRemoveSelection}
              ownedTeamId={userProfile.ownedTeamId}
            />
          )}
          {activeTab === "fixtures" && (
            <FixturesOdds
              fixtures={fixtures} teams={teams}
              roundIndex={userProfile.currentRoundIndex}
              currentRoundLabel={currentRoundLabel}
              selectedBets={selectedBets}
              onAddBetSelection={bettingHook.handleAddBetSelection}
              onRemoveSelection={bettingHook.handleRemoveSelection}
              onOpenBetBuilder={setBetBuilderFixtureId}
            />
          )}
          {activeTab === "bets" && (
            <MyBets
              tickets={userProfile.tickets} fixtures={fixtures} teams={teams}
              balance={userProfile.balance} onCashOut={bettingHook.handleCashOut}
              betBuilderTickets={userProfile.betBuilderTickets || []}
              challengesSlot={
                <Challenges
                  challenges={challengesHook.activeChallenges}
                  currentRoundIndex={userProfile.currentRoundIndex}
                  onClaim={challengesHook.handleClaimChallenge}
                  onDismiss={challengesHook.handleDismissChallenge}
                />
              }
            />
          )}
          {activeTab === "teams" && <TeamsList teams={teams} fixtures={fixtures} />}
          {activeTab === "analytics" && (
            <Analytics teams={teams} fixtures={fixtures} userProfile={userProfile} />
          )}
          {activeTab === "tournament" && (
            gameMode === "LEAGUE"
              ? <LeagueStandings teams={teams} fixtures={fixtures} currentRoundIndex={userProfile.currentRoundIndex} />
              : <TournamentBracket fixtures={fixtures} teams={teams} />
          )}
          {activeTab === "career" && <CareerStats career={careerProfile} />}
          {activeTab === "leaderboard" && (
            <Leaderboard
              tipsters={tipsters} userBalance={userProfile.balance}
              username={userProfile.username} tickets={userProfile.tickets}
            />
          )}
          {activeTab === "casino" && (
            <CasinoSuite
              balance={userProfile.balance}
              onUpdateBalance={profileHook.handleUpdateBalanceCasino}
              username={userProfile.username}
              currentRoundIndex={userProfile.currentRoundIndex}
            />
          )}
          {activeTab === "bonuses" && <BonusesPage />}
          {activeTab === "admin" && <AdminPanel username={userProfile.username} />}
          {activeTab === "fair-play" && <CompliancePage type="fair" />}
          {activeTab === "responsible-gaming" && <CompliancePage type="responsible" />}
          {activeTab === "myclub" && userProfile.ownedTeamId && (
            <ClubManager
              ownedTeamId={userProfile.ownedTeamId}
              teams={teams}
              balance={userProfile.balance}
              onUpdateOwnership={profileHook.handleUpdateClubOwnership}
              onUpgradeFacility={profileHook.handleUpgradeFacility}
              onUpdateBalance={(delta: number) => {
                if (!userProfile) return;
                const nextProfile = { ...userProfile, balance: Math.max(0, userProfile.balance + delta) };
                setUserProfile(nextProfile);
                persist(nextProfile);
              }}
            />
          )}
          {activeTab === "transfers" && userProfile.ownedTeamId && (
            <TransferMarket
              listings={transferListings}
              teams={teams}
              ownedTeamId={userProfile.ownedTeamId}
              currentRoundIndex={userProfile.currentRoundIndex}
              balance={userProfile.balance}
              userBid={userBid}
              onPlaceBid={handlePlaceUserBid}
              onWithdrawBid={handleWithdrawBid}
            />
          )}
          {activeTab === "feed" && (
            <SocialFeed fixtures={fixtures} teams={teams} roundLabel={currentRoundLabel} />
          )}
        </main>

        {!["casino","feed","myclub","transfers","worldcup","worldcup-live","worldcup-fixtures","worldcup-tournament","worldcup-quick-bet","bonuses","admin","fair-play","responsible-gaming"].includes(activeTab) && (
          <BettingSlip
            selections={selectedBets} fixtures={fixtures} teams={teams}
            onRemoveSelection={bettingHook.handleRemoveSelection}
            onClearAll={bettingHook.handleClearAllSelections}
            balance={userProfile.balance}
            onPlaceBet={bettingHook.handlePlaceBet}
            collapsed={collapsedSlip} setCollapsed={setCollapsedSlip}
            onAddSelections={bettingHook.handleAddMultipleSelections}
          />
        )}
      </div>
      <AppFooter setActiveTab={setActiveTab} />
      <FloatingChat />
      <GeoConsent />

      {/* Transfer toast */}
      {transferToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xl z-[200] animate-fade-in">
          {transferToast}
        </div>
      )}

      {showWalletModal && (
        <WalletModal
          balance={userProfile.balance}
          onConfirmTransaction={profileHook.handleConfirmWalletTransaction}
          onClose={() => setShowWalletModal(false)}
        />
      )}
      {showWinnerCelebration && (
        <WinnerCelebrationModal
          gameMode={gameMode}
          balance={userProfile.balance}
          championName={champion.name}
          championCrest={champion.crest}
          onClose={() => setShowWinnerCelebration(false)}
          onResetRound={handleResetAndGenerate}
        />
      )}
      {ownerRevenueReport && (
        <OwnerRevenueModal
          teamName={ownerRevenueReport.teamName}
          revenue={ownerRevenueReport.revenue}
          fixtures={ownerRevenueReport.fixtures}
          onClose={() => setOwnerRevenueReport(null)}
        />
      )}
      {globalEntity && (
        <GlobalEntityPreviewModal
          globalEntity={globalEntity}
          teams={teams}
          onClose={() => setGlobalEntity(null)}
          onChangeEntity={(entity) => setGlobalEntity(entity)}
          onNavigateToTeams={() => { setGlobalEntity(null); setActiveTab("teams"); }}
        />
      )}
      {betBuilderFixtureId && (() => {
        const bbFixture = fixtures.find(f => f.id === betBuilderFixtureId);
        return bbFixture ? (
          <BetBuilder
            fixture={bbFixture}
            teams={teams}
            balance={userProfile.balance}
            onPlace={handleBBPlace}
            onClose={() => setBetBuilderFixtureId(null)}
          />
        ) : null;
      })()}
      {showHighlightsFixture && (
        <MatchHighlightsModal
          fixture={showHighlightsFixture}
          teams={teams}
          onClose={() => setShowHighlightsFixture(null)}
        />
      )}
      <ToastContainer />
    </div>
  );
}
