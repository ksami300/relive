"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { loginKorisnika } from "../../lib/api";

export default function PremiumLoginPage() {
  const router = useRouter();
  const { login, token, isAudioPlaying, pokreniGlobalniAmbijent, toggleGlobalniAmbijent } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (token) {
      router.push("/corporate");
    }
  }, [token, router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (typeof pokreniGlobalniAmbijent === "function") {
      pokreniGlobalniAmbijent();
    }

    try {
      const res = await loginKorisnika(email, password);
      if (res?.success && res?.data?.token) {
        login(res.data.token, res.data.refreshToken || "", res.data.user);
        router.push("/corporate");
        return;
      }
      throw new Error(res?.message || "Neispravan odgovor servera.");
    } catch (err: any) {
      setErrorMsg(err.message || "Prijava nije uspela. Proverite podatke i pokušajte ponovo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] flex flex-col items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-pink-500/10 rounded-full blur-3xl animate-pulse" />

      <div className="absolute top-6 right-6 z-30">
        <button type="button" onClick={toggleGlobalniAmbijent} className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 hover:border-pink-400/40 text-slate-300 text-xs px-4 py-2.5 rounded-full backdrop-blur-md transition-all shadow-xl font-bold">
          <span>{isAudioPlaying ? "Simfonija Aktivna 🎻" : "Testiraj Zvuk Arije"}</span>
        </button>
      </div>

      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 space-y-6 relative z-10 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-pink-400/20 to-indigo-500/20 border border-indigo-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-2"><span className="text-xl">🧘‍♂️</span></div>
          <span className="text-[10px] font-black uppercase text-pink-300 bg-pink-400/10 border border-pink-400/20 px-3 py-1 rounded-full tracking-widest inline-block">SaaS Ekosistem</span>
          <h2 className="text-3xl font-black bg-gradient-to-r from-pink-300 via-indigo-200 to-blue-200 bg-clip-text text-transparent">Pristupi Miru</h2>
          <p className="text-slate-400 text-xs leading-relaxed">Unesi kredencijale za instant pokretanje unifikovanog zvučnog i ROI prstena.</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="login-email" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">E-mail Adresa</label>
            <input id="login-email" name="email" type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@domen.com" className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none transition-colors" />
          </div>
          <div className="space-y-1">
            <label htmlFor="login-password" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Bezbednosna Lozinka</label>
            <input id="login-password" name="password" type="password" required autoComplete="current-password" value={password} placeholder="Password" onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500/50 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none transition-colors" />
          </div>

          {errorMsg && <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl font-medium leading-relaxed">⚠️ {errorMsg}</p>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-pink-300 to-indigo-200 hover:from-pink-400 hover:to-indigo-300 disabled:from-slate-900 disabled:to-slate-900 text-slate-950 font-black py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-pink-500/5 active:scale-[0.98]">
            {loading ? "Otvaram zvučne kapije..." : "Pokreni Zen Sesiju i Ariju ⚡"}
          </button>
        </form>

        <div className="text-center"><p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Zaštićeno Erste/George platnim prstenom i unifikovanom JWT sesijom.</p></div>
      </div>
    </div>
  );
}
