import React, { useState } from "react";
import { Trophy, Award, Sparkles, User, Coins, Play, ArrowRight, Trash2 } from "lucide-react";

interface WelcomeScreenProps {
  onKickoff: (username: string, startingBalance: number, mode: "TOURNAMENT" | "LEAGUE", slot: number) => void;
  savedTournaments: boolean[]; // index 0, 1, 2 correspond to Slot 1, 2, 3
  savedLeagues: boolean[];      // index 0, 1, 2 correspond to Slot 1, 2, 3
  resumeActiveMode: (mode: "TOURNAMENT" | "LEAGUE", slot: number) => void;
  onDeleteSave: (mode: "TOURNAMENT" | "LEAGUE", slot: number) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onKickoff,
  savedTournaments,
  savedLeagues,
  resumeActiveMode,
  onDeleteSave
}) => {
  const [username, setUsername] = useState<string>("Tobi");
  const [balance, setBalance] = useState<number>(1000);
  const [mode, setMode] = useState<"TOURNAMENT" | "LEAGUE">("TOURNAMENT");
  const [selectedSlot, setSelectedSlot] = useState<number>(1);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{mode: "TOURNAMENT" | "LEAGUE", slot: number} | null>(null);

  // Selection presets for starting bankroll budget
  const balancePresets = [500, 1000, 2500, 5000];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    onKickoff(username.trim(), balance, mode, selectedSlot);
  };

  return (
    <div className="h-screen w-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-100 overflow-y-auto overflow-x-hidden font-sans select-none relative" id="welcome-gate-screen">
      <div className="min-h-full w-full flex items-center justify-center p-4 py-12 relative">
        {/* Background visual graphics - football pitch subtle glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none"></div>

        <div className="max-w-6xl w-full z-10 my-auto space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#141415] shadow-2xl min-h-[300px] md:min-h-[360px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_32%,rgba(16,185,129,0.28),transparent_28%),radial-gradient(circle_at_28%_85%,rgba(59,130,246,0.2),transparent_30%),linear-gradient(135deg,rgba(20,20,21,0.96),rgba(9,11,16,0.72))]" />
            <div className="absolute right-[-80px] top-[-60px] h-[320px] w-[320px] rounded-full border-[34px] border-emerald-400/10" />
            <div className="absolute right-4 bottom-0 hidden md:block h-[260px] w-[420px]">
              <div className="absolute bottom-[-68px] right-10 h-[250px] w-[250px] rounded-full bg-white/5 border border-white/10 shadow-[0_0_70px_rgba(16,185,129,0.18)]" />
              <div className="absolute bottom-12 right-28 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_35%,white_0_8%,#111827_9%_15%,white_16%_23%,#111827_24%_30%,white_31%)] border-4 border-white/80 shadow-2xl" />
              <div className="absolute bottom-6 right-2 h-52 w-32 rounded-t-full bg-gradient-to-b from-emerald-300 via-emerald-500 to-slate-950 border border-emerald-200/30 shadow-2xl" />
              <div className="absolute bottom-44 right-38 h-16 w-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-500 border border-white/30" />
            </div>
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 p-5 md:p-8 min-h-[300px] md:min-h-[360px]">
              <div className="flex flex-col justify-between gap-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-200">
                    <Sparkles size={13} />
                    World Cup 2026 sportsbook
                  </div>
                  <div>
                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-normal text-white leading-[0.92]">
                      win-worldcup
                    </h1>
                    <p className="mt-3 max-w-xl text-sm md:text-base text-slate-300 leading-relaxed">
                      Live match board, tournament map, fixtures and odds for the 2026 World Cup.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode("TOURNAMENT");
                      setSelectedSlot(1);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 text-sm font-black text-black hover:bg-emerald-300 transition-colors"
                  >
                    <Play size={16} fill="currentColor" />
                    Start betting hub
                  </button>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono">Opening bonus</div>
                    <div className="text-xl font-black text-white">500% BOOST</div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 content-end lg:content-center">
                {[
                  ["France", "1.72"],
                  ["Draw", "3.45"],
                  ["Morocco", "5.20"],
                  ["Live feed", "15s"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur">
                    <div className="text-[10px] uppercase tracking-widest text-slate-500 font-mono truncate">{label}</div>
                    <div className="mt-1 text-2xl font-black text-emerald-300">{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: Brand Concept Panel */}
        <div className="md:col-span-5 flex flex-col justify-between p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md relative">
          
          <div className="space-y-6 relative z-10">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black uppercase tracking-wider text-slate-100 font-sans leading-none">
                CU <span className="text-emerald-400">Bet</span>
              </h1>
              <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
                Campaign Seeding Arena
              </p>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Step into the ultimate visual betting and matches simulator. Take charge of a football club championship campaign as a general manager and elite bet predictor.
            </p>
          </div>

          {/* Quick Stats Panel / Resume options if they already exist */}
          <div className="pt-6 border-t border-white/5 mt-6 space-y-4 relative z-10 max-h-[340px] overflow-y-auto no-scrollbar">
            <h4 className="text-xs font-mono text-slate-405 uppercase tracking-widest block font-bold">
              Active Saved Sessions (Slots)
            </h4>
            
            <div className="space-y-4">
              {/* TOURNAMENT SLOTS */}
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold">
                  <Trophy size={11} className="shrink-0" />
                  <span>Tournament Mode</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[1, 2, 3].map((slot) => {
                    const exists = savedTournaments[slot - 1];
                    return (
                      <div key={`t-slot-${slot}`} className="flex items-center justify-between p-2 rounded-xl bg-white/2 border border-white/5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${exists ? "bg-amber-500 animate-pulse" : "bg-slate-700"}`} />
                          <span className="font-bold text-slate-305">Slot {slot}</span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {exists ? "Active Save" : "Empty Slot"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {exists ? (
                            <>
                              <button
                                type="button"
                                onClick={() => resumeActiveMode("TOURNAMENT", slot)}
                                className="bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-black px-2 py-0.5 rounded-md transition-all text-[9.5px] cursor-pointer"
                              >
                                Resume
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmation({ mode: "TOURNAMENT", slot })}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded-md transition-all cursor-pointer h-5 w-5 flex items-center justify-center border border-white/5 text-[9px]"
                                title="Delete Save Slot"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <span className="text-[8px] font-mono text-slate-600 uppercase">Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LEAGUE SLOTS */}
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                  <Award size={11} className="shrink-0" />
                  <span>Elite League Mode</span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {[1, 2, 3].map((slot) => {
                    const exists = savedLeagues[slot - 1];
                    return (
                      <div key={`l-slot-${slot}`} className="flex items-center justify-between p-2 rounded-xl bg-white/2 border border-white/5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${exists ? "bg-blue-400 animate-pulse" : "bg-slate-700"}`} />
                          <span className="font-bold text-slate-305">Slot {slot}</span>
                          <span className="text-[9px] font-mono text-slate-500">
                            {exists ? "Active Save" : "Empty Slot"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {exists ? (
                            <>
                              <button
                                type="button"
                                onClick={() => resumeActiveMode("LEAGUE", slot)}
                                className="bg-blue-500/15 hover:bg-blue-500 text-blue-300 hover:text-slate-950 font-black px-2 py-0.5 rounded-md transition-all text-[9.5px] cursor-pointer"
                              >
                                Resume
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmation({ mode: "LEAGUE", slot })}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1 rounded-md transition-all cursor-pointer h-5 w-5 flex items-center justify-center border border-white/5 text-[9px]"
                                title="Delete Save Slot"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <span className="text-[8px] font-mono text-slate-600 uppercase">Available</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {/* Right Side: Setup Form Panel */}
        <div className="md:col-span-7 flex flex-col justify-center p-8 rounded-3xl glass-panel-heavy border border-white/10 shadow-2xl relative">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight">
                Create Manager Profile
              </h2>
              <p className="text-xs text-slate-400 font-medium">Configure your initial parameters to enter the lobby</p>
            </div>

            {/* Input 1: Username */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <User size={12} className="text-slate-400" />
                Manager Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, 15))}
                  placeholder="Enter manager name..."
                  required
                  className="w-full bg-white/3 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Input 2: Starting Balance presets */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Coins size={12} className="text-slate-400" />
                Starting Budget Balance
              </label>
              <div className="grid grid-cols-4 gap-2">
                {balancePresets.map((val) => {
                  const isSelected = balance === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBalance(val)}
                      className={`py-2 rounded-lg text-xs font-bold font-mono transition-all border ${
                        isSelected
                          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                          : "bg-white/2 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-305 cursor-pointer"
                      }`}
                    >
                      ${val.toLocaleString()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input 3: Game Campaign Selection Cards */}
            <div className="space-y-2.5">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                Select Simulation Campaign Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Mode A: TOURNAMENT */}
                <div
                  onClick={() => setMode("TOURNAMENT")}
                  className={`p-4 rounded-2xl border transition-all duration-205 cursor-pointer flex flex-col space-y-2 relative select-none ${
                    mode === "TOURNAMENT"
                      ? "bg-slate-900 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)] text-white"
                      : "bg-white/2 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/3"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Trophy className={mode === "TOURNAMENT" ? "text-amber-500" : "text-slate-400"} size={18} />
                    {mode === "TOURNAMENT" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${mode === "TOURNAMENT" ? "text-slate-100" : "text-slate-300"}`}>
                      Knockout Tournament
                    </h3>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                      Play through a grand 16-team custom bracket. One loss and you are eliminated. Perfect cup rules!
                    </p>
                  </div>
                </div>

                {/* Mode B: LEAGUE */}
                <div
                  onClick={() => setMode("LEAGUE")}
                  className={`p-4 rounded-2xl border transition-all duration-205 cursor-pointer flex flex-col space-y-2 relative select-none ${
                    mode === "LEAGUE"
                      ? "bg-slate-900 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)] text-white"
                      : "bg-white/2 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/3"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Award className={mode === "LEAGUE" ? "text-blue-400" : "text-slate-400"} size={18} />
                    {mode === "LEAGUE" && (
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-450 animate-pulse"></span>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-sm font-bold ${mode === "LEAGUE" ? "text-slate-100" : "text-slate-300"}`}>
                      Elite League Table
                    </h3>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-relaxed">
                      Participate in a 15-round, 16-club league. Accumulate points, monitor goal stats, and aim for 1st place!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Input 4: Active Write Target Slot Selection */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block font-bold">
                Select Active Write Slot
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((slotNum) => {
                  const hasExist = mode === "TOURNAMENT" ? savedTournaments[slotNum - 1] : savedLeagues[slotNum - 1];
                  const isSelected = selectedSlot === slotNum;
                  return (
                    <button
                      key={`write-slot-${slotNum}`}
                      type="button"
                      onClick={() => setSelectedSlot(slotNum)}
                      className={`py-2 rounded-xl text-xs font-bold font-mono transition-all border flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-350 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                          : "bg-white/2 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300 cursor-pointer"
                      }`}
                    >
                      <span className="text-[11px]">Slot {slotNum}</span>
                      <span className="text-[8px] opacity-70">
                        {hasExist ? "⚠️ Overwrite" : "Empty Slot"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kick off CTA button */}
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-450 active:scale-98 text-slate-950 font-sans font-black tracking-wider uppercase py-3.5 px-4 rounded-2xl text-xs transition-all duration-150 flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 cursor-pointer mt-4"
            >
              KICK OFF CAMPAIGN
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </form>

        </div>
      </div>
    </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl shadow-red-500/10 animate-fade-in text-center flex flex-col items-center">
            <div className="h-12 w-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-2">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest font-sans">Delete Save?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to permanently delete the <span className="text-white font-bold">{deleteConfirmation.mode}</span> save in <span className="text-white font-bold">Slot {deleteConfirmation.slot}</span>? This action cannot be undone.
            </p>
            <div className="grid grid-cols-2 gap-3 w-full pt-4">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteSave(deleteConfirmation.mode, deleteConfirmation.slot);
                  setDeleteConfirmation(null);
                }}
                className="py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-slate-950 font-black text-xs transition-colors shadow-lg shadow-red-500/20"
              >
                Delete Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
