import React, { useState } from "react";
import { Tv, Calendar, Ticket, Users, BarChart3, Trophy, Award, Plus, RotateCcw, Activity, LogOut, Gamepad2, MessageSquare, ShieldCheck, ArrowLeftRight, Globe2, ChevronDown, UserCircle, WalletCards, Search, ArrowLeft, Gift, Scale, HeartHandshake, LayoutDashboard } from "lucide-react";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  username: string;
  balance: number;
  addFunds: () => void;
  resetTournament: () => void;
  currentRoundLabel: string;
  gameMode: "TOURNAMENT" | "LEAGUE";
  exitToMenu: () => void;
  hasOwnedClub?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  username,
  balance,
  addFunds,
  resetTournament,
  currentRoundLabel,
  gameMode,
  exitToMenu,
  hasOwnedClub = false,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [openMenu, setOpenMenu] = useState<"esports" | "worldcup" | "profile" | "search" | null>(null);
  const esportsTabs = [
    { id: "live", label: "Live", icon: <Tv size={14} className="opacity-85" /> },
    { id: "fixtures", label: "Fixtures & Odds", icon: <Calendar size={14} className="opacity-85" /> },
    { id: "tournament", label: gameMode === "LEAGUE" ? "Standings" : "Tournament", icon: <Trophy size={14} className="opacity-85" /> },
    { id: "teams", label: "Teams", icon: <Users size={14} className="opacity-85" /> },
  ];
  const worldCupTabs = [
    { id: "worldcup-live", label: "Live", icon: <Tv size={14} className="opacity-85" /> },
    { id: "worldcup-fixtures", label: "Fixtures & Odds", icon: <Calendar size={14} className="opacity-85" /> },
    { id: "worldcup-tournament", label: "Tournament", icon: <Trophy size={14} className="opacity-85" /> },
    { id: "worldcup-quick-bet", label: "One-click Bet", icon: <Ticket size={14} className="opacity-85" /> },
  ];
  const tabs = [
    { id: "bonuses", label: "Bonuses", icon: <Gift size={14} className="opacity-85" /> },
    { id: "bets", label: "My Bets", icon: <Ticket size={14} className="opacity-85" /> },
    { id: "feed", label: "Fan Feed", icon: <MessageSquare size={14} className="opacity-85" /> },
    { id: "casino", label: "Elite Casino", icon: <Gamepad2 size={14} className="opacity-[0.95] text-amber-450" /> },
    ...(hasOwnedClub ? [{ id: "myclub", label: "My Club", icon: <ShieldCheck size={14} className="text-emerald-400" /> }] : []),
    ...(hasOwnedClub ? [{ id: "transfers", label: "Transfers", icon: <ArrowLeftRight size={14} className="text-sky-400" /> }] : []),
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={14} className="opacity-85" /> },
    { id: "leaderboard", label: "Leaderboard", icon: <Award size={14} className="opacity-85" /> },
    { id: "career", label: "Career", icon: <div className="text-yellow-400 font-bold">🏅</div> },
    { id: "fair-play", label: "Fair Play", icon: <Scale size={14} className="opacity-85" /> },
    { id: "responsible-gaming", label: "Responsible Gaming", icon: <HeartHandshake size={14} className="opacity-85" /> },
    { id: "admin", label: "Admin", icon: <LayoutDashboard size={14} className="opacity-85" /> },
  ];
  const esportsActive = esportsTabs.some((tab) => tab.id === activeTab);
  const worldCupActive = worldCupTabs.some((tab) => tab.id === activeTab) || activeTab === "worldcup";

  const DropdownGroup = ({
    label,
    icon,
    items,
    active,
    menuId,
  }: {
    menuId: "esports" | "worldcup";
    label: string;
    icon: React.ReactNode;
    items: typeof esportsTabs;
    active: boolean;
  }) => (
    <div className="relative group shrink-0">
      <button
        type="button"
        onClick={() => setOpenMenu(openMenu === menuId ? null : menuId)}
        title={`${label} pages`}
        className={`flex items-center gap-1.5 px-2 md:px-3 py-2 md:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer min-w-[36px] min-h-[36px] justify-center md:justify-start ${
          active
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]"
            : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
        }`}
      >
        <span className="shrink-0">{icon}</span>
        <span className="hidden md:inline">{label}</span>
        <ChevronDown size={12} className={`opacity-80 transition-transform ${openMenu === menuId ? "rotate-180" : ""}`} />
      </button>
      {openMenu === menuId && <div className="absolute left-0 top-full pt-2 z-[80]">
        <div className="min-w-[190px] rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur p-1">
          {items.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setOpenMenu(null);
                }}
                className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                  isActive ? "bg-emerald-500/15 text-emerald-300" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>}
    </div>
  );

  return (
    <header className="glass-panel border-x-0 border-t-0 rounded-none h-16 px-4 md:px-6 flex items-center justify-between select-none shrink-0 z-40">
      {/* Brand logo */}
      <button type="button" onClick={() => window.history.back()} className="mr-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white p-2 rounded-lg border border-white/10 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center" title="Back">
        <ArrowLeft size={14} />
      </button>
      <button type="button" onClick={exitToMenu} className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity" title="Go to home">
        <Activity size={20} className="animate-pulse text-emerald-400" />
        <div className="hidden sm:block">
          <h1 className="text-sm font-black tracking-wider uppercase text-emerald-400 font-sans leading-none">
            win-worldcup
          </h1>
          <p className="text-[10px] text-slate-400 font-mono tracking-widest leading-none mt-1">
            WORLD CUP 2026 LIVE
          </p>
        </div>
      </button>

      {/* Navigation tabs */}
      <nav className="flex items-center overflow-visible max-w-[45%] sm:max-w-[55%] md:max-w-none h-full mx-2">
        <div className="flex items-center gap-0.5 md:gap-1">
          <DropdownGroup
            menuId="esports"
            label="Esports"
            icon={<Gamepad2 size={14} className="opacity-85" />}
            items={esportsTabs}
            active={esportsActive}
          />
          <DropdownGroup
            menuId="worldcup"
            label="World Cup"
            icon={<Globe2 size={14} className="text-emerald-300" />}
            items={worldCupTabs}
            active={worldCupActive}
          />
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={`flex items-center gap-1.5 px-2 md:px-3 py-2 md:py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer min-w-[36px] min-h-[36px] justify-center md:justify-start ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white border border-transparent"
                }`}
              >
                <span className="shrink-0">{tab.icon}</span>
                <span className="hidden md:inline">{tab.label}</span>
                {tab.id === "live" && (
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Profile & Wallet */}
      <div className="flex items-center gap-1.5 md:gap-3">
        <button
          type="button"
          onClick={() => setOpenMenu(openMenu === "search" ? null : "search")}
          title="Search"
          className="bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white p-2 rounded-lg border border-white/10 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <Search size={14} />
        </button>
        {openMenu === "search" && (
          <div className="absolute right-32 top-16 z-[80] w-[320px] rounded-xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-2">
              <Search size={14} className="text-emerald-300" />
              <input className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-500" placeholder="Search teams, fixtures, props..." />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-300">
              {["World Cup live", "Fixture odds", "USDT cashier", "Responsible gaming"].map((item) => (
                <button key={item} className="rounded-lg bg-white/5 px-2 py-2 text-left hover:bg-white/10">{item}</button>
              ))}
            </div>
          </div>
        )}
        {/* Wallet Display */}
        <button type="button" onClick={addFunds} className="bg-white/5 px-2 md:px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5 md:gap-2 hover:bg-white/10 transition-colors">
          <span className="hidden sm:inline text-[9px] font-mono text-slate-400 tracking-wider">WALLET:</span>
          <span className="text-xs font-bold text-emerald-400 font-mono">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="ml-0.5 md:ml-1.5 bg-emerald-500/20 text-emerald-400 p-0.5 px-1 rounded-md flex items-center justify-center font-black text-[10px] min-w-[24px] min-h-[24px]">
            <Plus size={10} strokeWidth={3} />
          </span>
        </button>

        {/* Current Round Indicator */}
        <div className="hidden lg:flex flex-col items-end border-l border-white/10 pl-3">
          <span className="text-[10px] text-slate-400 font-mono leading-none">STAGE</span>
          <span className="text-xs font-black text-emerald-400 font-sans tracking-tight mt-0.5">
            {currentRoundLabel}
          </span>
        </div>

        {/* Developer resets option */}
        <button
          onClick={() => setShowResetConfirm(true)}
          title="Restart Championship"
          className="bg-red-500/10 hover:bg-red-500/30 text-red-400 p-2 rounded-lg border border-red-500/20 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <RotateCcw size={14} />
        </button>

        {/* Exit to Main Menu option */}
        <button
          onClick={exitToMenu}
          title="Exit to Mode Selection"
          className="bg-slate-500/15 hover:bg-slate-500/35 text-slate-300 hover:text-white p-2 rounded-lg border border-white/10 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <LogOut size={14} />
        </button>

        {showResetConfirm && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[100] animate-fade-in animate-duration-200">
            <div className="glass-panel border-red-500/30 max-w-md w-full p-6 text-center space-y-4 shadow-[0_0_50px_rgba(239,68,68,0.15)] mx-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30 text-red-400">
                <RotateCcw size={24} className="animate-spin-slow" />
              </div>
              
              <div className="space-y-1">
                <span className="text-[10px] text-red-400 font-mono tracking-widest uppercase font-bold">
                  ⚠️ DANGER ZONE
                </span>
                <h3 className="text-sm font-bold text-slate-100 font-sans tracking-tight">
                  Reset Tournament Championship?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  This action is irreversible. All current fixtures, live standings, bets history, and user wallet profile statistics will be wiped and seeded with a fresh Round of 32 champion cup.
                </p>
              </div>
              
              <div className="flex items-center gap-3 justify-center pt-2 select-none">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="bg-white/5 hover:bg-white/10 text-slate-300 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer border border-white/5 hover:text-white transition-all duration-150"
                >
                  Nevermind, Cancel
                </button>
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    resetTournament();
                  }}
                  className="bg-red-500 hover:bg-red-650 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-red-500/10 hover:shadow-red-500/20 active:scale-95 transition-all duration-150"
                >
                  Yes, Completely Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* User profile menu */}
        <div className="relative hidden md:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOpenMenu(openMenu === "profile" ? null : "profile")}
            className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center font-black text-slate-900 border border-emerald-400 shadow-lg shadow-emerald-500/20 hover:bg-emerald-300 transition-colors"
            title="Profile"
          >
            {username.slice(0, 2).toUpperCase()}
          </button>
          {openMenu === "profile" && (
            <div className="absolute right-0 top-full mt-2 min-w-[220px] rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur p-1 z-[80]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("bets");
                  setOpenMenu(null);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <UserCircle size={14} className="text-emerald-300" />
                <span className="font-bold">Bet history</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  addFunds();
                  setOpenMenu(null);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <WalletCards size={14} className="text-sky-300" />
                <span className="font-bold">Recharge wallet</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
