"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { withAuth } from "../../hoc/withAuth";
import { API_URL } from "../../lib/api";

function RelieveUserAppPage() {
  const { logout, isAudioPlaying, toggleGlobalniAmbijent } = useAuth();
  
  const [trenutnoOsecanje, setTrenutnoOsecanje] = useState("");
  const [stresPrePoruke, setStresPrePoruke] = useState(75);
  const [stresPoslePoruke, setStresAfter] = useState(40);
  const [korakSesije, setKorakSesije] = useState("EMOCIJA"); 
  const [brojacDisanja, setBrojacDisanja] = useState(10);
  const [statusPoruka, setStatusPoruka] = useState("Dobrodosli u Vas prostor za duboko oslobadjanje stresa.");

  const handleSledeciKorakDisanje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trenutnoOsecanje) {
      setStatusPoruka("⚠️ Molimo Vas upisite kako se osećate.");
      return;
    }
    setKorakSesije("DISANJE");
    setStatusPoruka("🧘‍♂️ Ritam kontrolisanog disanja pokrenut. Ispratite 10 ciklusa.");
  };

  useEffect(() => {
    if (korakSesije === "DISANJE" && brojacDisanja > 0) {
      const timer = setTimeout(() => setBrojacDisanja(prev => prev - 1), 2500);
      return () => clearTimeout(timer);
    } else if (korakSesije === "DISANJE" && brojacDisanja === 0) {
      setKorakSesije("SETNJA");
      setStatusPoruka("🚶‍♂️ Odlicno! Sada ustanite i prosetajte 10 koraka.");
    }
  }, [korakSesije, brojacDisanja]);

  const zavrsiMegalomanOporavak = async (feedbackTip: string) => {
    setStatusPoruka("🔄 Urezujem ishod neuro-sesije u zasticene B2B kaveze...");
    try {
      const token = localStorage.getItem("token");
      if (!token || token === "null" || token === "undefined") {
        throw new Error("Sesija je istekla. Prijavite se ponovo.");
      }

      const response = await fetch(`${API_URL}/api/relieve/stress/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stressLevel: stresPoslePoruke, osecaj: trenutnoOsecanje }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || "Neuspesno snimanje podataka o stresu.");
      }

      setStatusPoruka(`🏆 Uspeh! Stres oboren sa ${stresPrePoruke}% na ${stresPoslePoruke}%!`);
      setKorakSesije("ZAVRSENO");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Neuspesno snimanje neuro-sesije.";
      setStatusPoruka(message);
      setKorakSesije("ZAVRSENO");
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] p-6 text-slate-200 font-mono text-xs uppercase tracking-widest flex items-center justify-center">
      <div className="max-w-md w-full bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
        
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div>
            <span className="text-[9px] font-black text-cyan-400 block">Relieve Zen Space</span>
            <h1 className="text-sm font-black text-slate-100">Neuro-Recovery App</h1>
          </div>
          <button onClick={logout} className="bg-slate-950 border border-slate-800 px-3 py-1 rounded text-slate-500">Izlaz</button>
        </div>

        <div className="bg-gradient-to-r from-cyan-950/20 to-slate-900 p-4 rounded-xl border border-cyan-500/20 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-cyan-300 block">432Hz Audio Matrix</span>
            <span className="text-[9px] text-slate-500 font-sans block lowercase">Nativno zaptivanje zvuka</span>
            <span className="text-[9px] text-pink-400 font-bold block mt-1 animate-pulse">⚠️ VAŽNO: Stavite slušalice i smanjite jačinu zvuka na 40% pre početka sesije radi bezbednosti uma!</span>
          </div>
          <button type="button" onClick={toggleGlobalniAmbijent} className="bg-slate-950 text-slate-400 border border-slate-800 px-3 py-2 rounded font-bold text-[10px]">
            {isAudioPlaying ? "⏸ STOP" : "🎵 PUSTI 432Hz"}
          </button>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-center text-cyan-400 text-[10px]">
          {statusPoruka}
        </div>

        {korakSesije === "EMOCIJA" && (
          <form onSubmit={handleSledeciKorakDisanje} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="emocija" className="text-slate-400 block text-[10px]">Kako se osecate?</label>
              <input id="emocija" type="text" value={trenutnoOsecanje} onChange={(e) => setTrenutnoOsecanje(e.target.value)} placeholder="Upisite osecaj..." className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-slate-200" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]"><span>Stres pre:</span><span>{stresPrePoruke}%</span></div>
              <input type="range" min="10" max="100" value={stresPrePoruke} onChange={(e) => setStresPrePoruke(Number(e.target.value))} className="w-full" />
            </div>
            <button type="submit" className="w-full bg-cyan-500/10 border border-cyan-500/30 py-3 rounded-xl text-cyan-400 font-bold">Zapocni Oporavak 🚀</button>
          </form>
        )}

        {korakSesije === "DISANJE" && (
          <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-800">
            <div className="text-4xl font-black text-cyan-400">{brojacDisanja}</div>
            <p className="text-xs text-slate-300">Udisite i izdisite polako...</p>
          </div>
        )}

        {korakSesije === "SETNJA" && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-300">Prosetajte 10 koraka van radnog stola radi reseta uma.</p>
            <button type="button" onClick={() => setKorakSesije("ISHOD")} className="w-full bg-emerald-500/10 border border-emerald-500/30 py-3 rounded-xl text-emerald-400 font-bold">Check-Out 🚶‍♂️</button>
            <button type="button" onClick={() => { setKorakSesije("EMOCIJA"); setBrojacDisanja(10); }} className="w-full bg-slate-950 border border-slate-800 py-2 rounded-xl text-slate-500 text-[10px] mt-2">↩ Nazad na unos</button>
          </div>
        )}

        {korakSesije === "ISHOD" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]"><span>Stres posle:</span><span>{stresPoslePoruke}%</span></div>
              <input type="range" min="10" max="100" value={stresPoslePoruke} onChange={(e) => setStresAfter(Number(e.target.value))} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => zavrsiMegalomanOporavak("HELPED")} className="bg-emerald-500/10 text-emerald-400 border font-bold py-2 rounded-xl text-[10px]">👍 Pomoglo je</button>
              <button type="button" onClick={() => zavrsiMegalomanOporavak("NO_CHANGE")} className="bg-slate-800/40 text-slate-400 border font-bold py-2 rounded-xl text-[10px]">😐 Bez promene</button>
            </div>
          </div>
        )}

        {korakSesije === "ZAVRSENO" && (
          <div className="space-y-3">
            <button type="button" onClick={() => { setKorakSesije("EMOCIJA"); setBrojacDisanja(10); setTrenutnoOsecanje(""); setStatusPoruka("Sistem spreman za novu stabilizaciju.");
      if(typeof window !== "undefined") { window.sessionStorage.clear(); } }} className="w-full bg-slate-950 border border-slate-800 py-3 rounded-xl text-slate-400 font-bold mb-2">Nova Sesija 🔄</button>
            <button type="button" onClick={() => alert("📧 B2B ZAHTEV AKTIVIRAN: Molimo kontaktirajte nas direktno na office@relieve.com radi hitnog pokretanja 14-dnevnog pilot programa!")} className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 py-3 rounded-xl text-cyan-400 font-black text-[10px] tracking-widest animate-pulse transition-all">UNLOCK UNLIMITED PRO ACCESS (9$) 💳🚀</button>
          </div>
        )}

        <div className="border-t border-slate-800 pt-3 text-[9px] text-slate-500 flex justify-between font-sans">
          <span>Tenant Room: org_1</span>
          <span className="text-emerald-500 font-bold">● Network Sync Connected</span>
        </div>

      </div>
    </div>
  );
}

export default withAuth(RelieveUserAppPage);
