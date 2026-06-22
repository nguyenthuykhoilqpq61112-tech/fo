import React, { useState, useMemo } from "react";
import { PurchasedItem, LuxuryItem, LuxuryCategory } from "../types";
import { STORE_ITEMS } from "../data/luxuryItems";
import { InfoButton } from "./ui/InfoButton";
import { Skeleton } from "./ui/Skeleton";

interface VIPStoreProps {
  balance: number;
  purchasedItems: PurchasedItem[];
  onPurchase: (itemDetails: Omit<PurchasedItem, "dateStr" | "id"> & { id: string }) => void;
  onLiquidate: (item: PurchasedItem) => void;
}

const CATEGORIES = ["All", ...Array.from(new Set(STORE_ITEMS.map(i => i.category)))];

const RarityColors: Record<string, string> = {
  "Common": "bg-slate-500/20 text-slate-400 border-slate-500/30",
  "Rare": "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Ultra Rare": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Legendary": "bg-amber-500/20 text-amber-500 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)] animate-[pulse_2s_ease-in-out_infinite]"
};

export const VIPStore: React.FC<VIPStoreProps> = ({ balance, purchasedItems, onPurchase, onLiquidate }) => {
  const [activeTab, setActiveTab] = useState<"store" | "inventory">("store");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const totalWorth = purchasedItems.reduce((sum, item) => sum + item.worth, 0);

  const filteredStoreItems = useMemo(() => {
    let items = STORE_ITEMS;
    if (selectedCategory !== "All") {
      items = items.filter(i => i.category === selectedCategory);
    }
    // Filter out already owned items
    const ownedIds = new Set(purchasedItems.map(p => p.id));
    return items.filter(i => !ownedIds.has(i.id));
  }, [selectedCategory, purchasedItems]);

  const ImageWithSkeleton = ({ src, alt, index }: { src: string, alt: string, index: number }) => {
    const [loaded, setLoaded] = useState(false);
    return (
      <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3.5 border border-white/5 bg-[#0a111a] group shrink-0">
        {!loaded && <Skeleton className="absolute inset-0 z-10" />}
        <img
          src={src}
          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          alt={alt}
          loading={index < 4 ? "eager" : "lazy"}
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            setLoaded(true);
          }}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto w-full p-4 md:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-4 select-none gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-amber-500 font-sans tracking-tight">Luxury VIP Store</h2>
            <p className="text-xs text-slate-400">Spend your sportsbook winnings on prestigious virtual assets.</p>
          </div>
          <InfoButton 
            title="VIP Luxury Store" 
            body="Purchase high-end sports cars, penthouses, superyachts, exclusive fashion, and private flights. Items here are purely status symbols and do not affect gameplay, though they can be liquidated later for collateral." 
          />
        </div>
        <div className="flex border border-white/10 rounded-lg overflow-hidden bg-black/40 shrink-0">
          <button
            onClick={() => setActiveTab("store")}
            className={`px-6 py-2 text-xs font-bold transition-colors cursor-pointer ${activeTab === "store" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}
          >
            Showroom
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-6 py-2 text-xs font-bold transition-colors cursor-pointer ${activeTab === "inventory" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:bg-white/5"}`}
          >
            Trophy Room ({purchasedItems.length})
          </button>
        </div>
      </div>

      {activeTab === "store" && (
        <div className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar select-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat ? "bg-amber-500 text-amber-950 shadow-[0_0_10px_rgba(245,158,11,0.3)] font-black" : "bg-white/5 text-slate-400 hover:bg-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
            {filteredStoreItems.map((item, index) => (
              <div key={item.id} className={`glass-card bg-[#0a111a]/85 border ${item.rarity === 'Legendary' ? 'border-amber-500/30' : 'border-white/5'} rounded-2xl p-4 flex flex-col hover:border-white/10 transition-all duration-200`}>
                
                <ImageWithSkeleton src={item.imageUrl} alt={item.name} index={index} />

                <div className="space-y-1 mb-2">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="text-xs font-bold text-slate-200 line-clamp-1 leading-snug" title={item.name}>{item.name}</h3>
                    <span 
                      className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${RarityColors[item.rarity] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
                    >
                      {item.rarity}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 h-8 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>
                
                <div className="mt-auto pt-4 space-y-2 select-none">
                  <div className="p-2.5 bg-black/45 rounded-xl space-y-1.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">Acquisition Cost:</span>
                      <span className="font-bold text-amber-500">${item.price.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onPurchase({ ...item, worth: Math.floor(item.price * 0.85), icon: item.imageUrl })}
                    disabled={balance < item.price}
                    className="w-full py-2 rounded-xl font-bold text-[10px] uppercase cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 bg-amber-500 hover:bg-amber-444 text-amber-950 transition-colors shadow-lg active:scale-[0.98]"
                  >
                    {balance >= item.price ? "Acquire Asset" : "Insufficient Wallet"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "inventory" && (
        <div className="space-y-4">
          <div className="mb-2 p-4 glass-card bg-emerald-950/10 border-emerald-500/20 rounded-xl flex items-center justify-between select-none">
            <div>
              <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">Total Asset Portfolio Collateral</span>
              <div className="text-2xl font-black text-emerald-450 font-mono mt-0.5">${totalWorth.toLocaleString()}</div>
            </div>
            <div className="text-3xl text-emerald-400">💼</div>
          </div>

          <p className="text-sm text-slate-400 mb-4 bg-white/5 py-1 px-3 rounded inline-block">You own {purchasedItems.length} / {STORE_ITEMS.length} luxury items.</p>

          {purchasedItems.length === 0 ? (
            <div className="text-center py-24 bg-black/20 rounded-2xl border border-white/5 select-none">
              <span className="text-4xl opacity-40 mb-3 block">🕸️</span>
              <h3 className="text-slate-300 font-bold text-sm">Your luxury portfolio is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Visit the showroom above to invest your winnings on prestigous real estate, hypercars, aircrafts, and businesses.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 pb-20">
              {purchasedItems.map((item, idx) => (
                <div key={item.id + idx} className={`glass-card bg-[#0a111a]/85 border ${item.rarity === 'Legendary' ? 'border-amber-500/30' : 'border-white/5'} rounded-2xl p-4 relative overflow-hidden group flex flex-col hover:border-white/10 transition-all duration-200`}>
                  
                  {item.imageUrl ? (
                    <ImageWithSkeleton src={item.imageUrl} alt={item.name} index={idx} />
                  ) : (
                    <div className="text-3.5xl mb-2 text-center opacity-85 select-none">{item.icon}</div>
                  )}

                  <div className="space-y-1 mb-2">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="text-xs font-bold text-slate-200 line-clamp-1 leading-snug">{item.name}</h3>
                      {item.rarity && (
                         <span 
                           className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border whitespace-nowrap ${RarityColors[item.rarity] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}
                         >
                           {item.rarity}
                         </span>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">Acquired: {item.dateStr}</p>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-white/5 space-y-1 select-none">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-500">Paid:</span>
                      <span className="text-slate-400 font-semibold">${item.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400">Current Value:</span>
                      <span className="text-emerald-450 font-mono">${item.worth.toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onLiquidate(item)}
                    className="mt-3 w-full py-2 cursor-pointer border border-rose-500/20 hover:bg-rose-500/10 text-rose-455 rounded-xl text-[10px] font-bold uppercase transition-all active:scale-[0.98]"
                  >
                    Liquidate Asset
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
