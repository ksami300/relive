"use client";

import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { withAuth } from "../../hoc/withAuth";
import { posaljiStresPulsSaAmortizerom } from "../../lib/api";

function UserDashboardPage() {
  const { user, logout } = useAuth();
  const [stressInput, setStressInput] = useState(50);
  const [pulseLoading, setPulseLoading] = useState(false);
  const [pulseMsg, setPulseMsg] = useState("");

  const handleSendStressPulse = async () => {
    setPulseLoading(true);
    setPulseMsg("");
    try {
      const res = await posaljiStresPulsSaAmortizerom(stressInput);
      if (res.success) {
        setPulseMsg(`✓ Puls od ${stressInput}% uspešno zabeležen sa amortizerom!`);
      }
    } catch (err: any) {
      setPulseMsg("Greška pri slanju pulsa.");
    } finally {
      setPulseLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 sm:p-12 text-slate-100 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
      
      <div className="max-w-3xl mx-auto space-y-8 relative z-10">
        
        {/* HEADER */}
        <header className="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl backdrop-blur-xl">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest block mb-1">Korisnicki Prostor</span>
            <h1 className="text-2xl font-black text-slate-100">Zdravo, {user?.name || "Korisnice"} 👋</h1>
          </div>
          <button onClick={logout} className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 text-xs font-bold px-4 py-2 rounded-xl transition-all">
            Odjava
          </button>
        </header>

        {/* INTERAKTIVNI SLIDER AMORTIZERA */}
        <div className="bg-slate-900/30 border border-slate-800/60 p-8 rounded-3xl space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-200">Kako se osecas ovog trenutka?</h3>
            <p className="text-xs text-slate-400">Pomeri klizac da zabelezis trenutni nivo mentalnog pritiska i usmeris CDN audio amortizere.</p>
          </div>

          <div className="space-y-4">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={stressInput}
              onChange={(e) => setStressInput(Number(e.target.value))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-xs font-mono text-slate-500">
              <span>0% (Potpuni Mir)</span>
              <span className="text-emerald-400 font-bold text-sm">Trenutni Puls: {stressInput}%</span>
              <span>100% (Visok Stres)</span>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button 
              onClick={handleSendStressPulse}
              disabled={pulseLoading}
              className="bg-gradient-to-r from-emerald-400 to-indigo-500 hover:from-emerald-500 hover:to-indigo-600 text-slate-950 font-black text-xs px-6 py-3.5 rounded-xl transition-all shadow-lg"
            >
              {pulseLoading ? "Slanje..." : "Zabelezi Stres Puls ⚡"}
            </button>
            {pulseMsg && <span className="text-xs text-emerald-400 font-medium">{pulseMsg}</span>}
          </div>
        </div>

      </div>
    </div>
  );
}

export default withAuth(UserDashboardPage);
