import {useEffect, useState} from 'react';
import {Gift, Headphones, MapPin, ShieldCheck, Star, Trophy, WalletCards} from 'lucide-react';
import {fetchAdminSummary, type AdminSummary} from '../api/serverApi';

export function BonusesPage() {
  const tiers = [
    ['Starter', '$0+', '1 point / $10 wagered', '$5 free bet exchange'],
    ['Matchday', '$1,000+', '1.5 points / $10 wagered', 'Weekly odds boosts'],
    ['Elite', '$10,000+', '2 points / $10 wagered', 'Season bonus and VIP concierge'],
    ['Legend', '$50,000+', '3 points / $10 wagered', 'Travel and hotel reward review'],
  ];
  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="rounded-3xl border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(2,6,23,0.7)),radial-gradient(circle_at_75%_30%,rgba(245,158,11,0.18),transparent_32%)] p-6">
        <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">Rewards center</div>
        <h2 className="mt-2 text-3xl font-black text-white">Bonuses, deposit match, referrals, and loyalty tiers</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-300">Minimum deposit: $20. Minimum bet: $1. Bonus credits are promotional and subject to rollover, settlement, and risk review.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          ['Welcome bonus', '100% deposit match up to $500 on first approved deposit.'],
          ['Daily bonus', 'Daily free bet token after a settled World Cup wager.'],
          ['Season bonus', 'Tiered World Cup leaderboard payout after tournament final.'],
          ['Referral bonus', 'Invite a verified user and unlock bonus credit after their first settled wager.'],
        ].map(([title, copy]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <Gift className="text-emerald-300" size={20} />
            <h3 className="mt-3 text-sm font-black text-white">{title}</h3>
            <p className="mt-2 text-xs leading-5 text-slate-400">{copy}</p>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <h3 className="text-lg font-black text-white">Loyalty plan</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          {tiers.map(([tier, spend, earn, reward]) => (
            <div key={tier} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <Star size={18} className="text-amber-300" />
              <div className="mt-2 text-sm font-black text-white">{tier}</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-slate-500">{spend}</div>
              <div className="mt-3 text-xs text-emerald-300 font-bold">{earn}</div>
              <div className="mt-1 text-xs text-slate-400">{reward}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function AdminPanel({username}: {username: string}) {
  const isAdmin = username.toLowerCase() === 'admin';
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!isAdmin) return;
    fetchAdminSummary().then(setSummary).catch((err) => setError((err as Error).message));
  }, [isAdmin]);
  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <div className="text-[10px] uppercase tracking-widest text-emerald-300 font-black">Admin console</div>
        <h2 className="mt-2 text-2xl font-black text-white">User, wallet, and risk operations</h2>
        <p className="mt-2 text-sm text-slate-400">Use username <span className="font-bold text-white">admin</span> for the protected admin view. Other accounts see a restricted preview.</p>
      </div>
      {!isAdmin && <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">Admin access is restricted.</div>}
      {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 opacity-100">
        {[
          ['Users', String(summary?.users.length ?? 0), 'Registrations, status, KYC notes'],
          ['Wallet ledger', String(summary?.walletLedgerCount ?? 0), 'USDT tx hash review queue'],
          ['Bet audits', String(summary?.betAuditCount ?? 0), 'Manual support approval required'],
        ].map(([title, value, copy]) => (
          <div key={title} className="rounded-2xl border border-white/10 bg-black/25 p-5">
            <div className="text-[10px] uppercase tracking-widest text-slate-500">{title}</div>
            <div className="mt-2 text-3xl font-black text-white">{value}</div>
            <div className="mt-2 text-xs text-slate-400">{copy}</div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <h3 className="text-sm font-black text-white">Manual approval queues</h3>
        {summary?.users.map((user) => (
          <div key={user.id} className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm">
            <span className="text-slate-200">{user.username}</span>
            <span className="text-emerald-300 font-black">active account</span>
          </div>
        ))}
        {['USDT deposit tx review', 'Withdrawal support ticket', 'Bonus abuse review', 'Location compliance review'].map((row, index) => (
          <div key={row} className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm">
            <span className="text-slate-200">{row}</span>
            <span className="text-emerald-300 font-black">{index + 3} pending</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CompliancePage({type}: {type: 'fair' | 'responsible'}) {
  const fair = type === 'fair';
  return (
    <section className="h-full overflow-y-auto p-4 md:p-6 space-y-5">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <ShieldCheck className="text-emerald-300" size={28} />
        <h2 className="mt-3 text-2xl font-black text-white">{fair ? 'Fair competition' : 'Responsible gaming'}</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          {fair
            ? 'Markets display source labels, settlement rules, minimum bet limits, and manual review notices for wallet activity.'
            : 'Set limits, take breaks, and contact support for self-exclusion or account cooling periods. Users must comply with local laws and be of legal age.'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(fair
          ? ['Transparent market source', 'Manual wallet confirmation', 'Settlement audit trail']
          : ['Deposit and wager limits', 'Cooling-off support', 'Legal age and location check']
        ).map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm font-bold text-slate-200">{item}</div>
        ))}
      </div>
    </section>
  );
}

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-5 right-5 z-[90]">
      {open && (
        <div className="mb-3 w-[320px] rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
          <div className="flex items-center gap-2 text-sm font-black text-white"><Headphones size={16} className="text-emerald-300" />Live support</div>
          <div className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-slate-300">Withdrawals are handled by support. Send your account ID, requested amount, and wallet address for manual review.</div>
          <input className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs outline-none" placeholder="Type a message..." />
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="rounded-full bg-emerald-400 p-4 text-black shadow-2xl hover:bg-emerald-300">
        <Headphones size={22} />
      </button>
    </div>
  );
}

export function GeoConsent() {
  const [status, setStatus] = useState(localStorage.getItem('geo_consent_v1') || '');
  if (status) return null;
  return (
    <div className="fixed bottom-5 left-5 z-[90] max-w-sm rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-black text-white"><MapPin size={16} className="text-emerald-300" />Location check</div>
      <p className="mt-2 text-xs leading-5 text-slate-400">Allow location during use to support local compliance checks and market availability.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={() => {
          navigator.geolocation?.getCurrentPosition(() => undefined, () => undefined);
          localStorage.setItem('geo_consent_v1', 'allowed');
          setStatus('allowed');
        }} className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black">Allow</button>
        <button onClick={() => { localStorage.setItem('geo_consent_v1', 'dismissed'); setStatus('dismissed'); }} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white">Not now</button>
      </div>
    </div>
  );
}

export function AppFooter({setActiveTab}: {setActiveTab: (tab: string) => void}) {
  return (
    <footer className="border-t border-white/10 bg-black/35 px-4 py-3 text-[10px] text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
        <span>win-worldcup sportsbook demo · Min deposit $20 · Min bet $1 · 18+ only</span>
        <div className="flex gap-3">
          <button onClick={() => setActiveTab('fair-play')} className="hover:text-emerald-300">Fair competition</button>
          <button onClick={() => setActiveTab('responsible-gaming')} className="hover:text-emerald-300">Responsible gaming</button>
          <button onClick={() => setActiveTab('bonuses')} className="hover:text-emerald-300">Bonuses</button>
        </div>
      </div>
    </footer>
  );
}
