"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { loginKorisnika } from "../../lib/api";
import { soundEngine } from "../../lib/soundEngine";

export default function CalmLoginPage() {
  const router = useRouter();
  const { login, token } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [playingFreq, setPlayingFreq] = useState<number | null>(null);

  useEffect(() => {
    if (token) router.push("/dashboard");
  }, [token, router]);

  const handleTestFreq = (freq: number) => {
    const active = soundEngine.toggle(freq);
    setPlayingFreq(active ? freq : null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await loginKorisnika(email, password);
      if (res?.success && res?.data?.token) {
        login(res.data.token, res.data.refreshToken || "", res.data.user);
        router.push("/dashboard");
        return;
      }
      throw new Error(res?.message || "Neispravan odgovor servera.");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Prijava nije uspela. Proverite podatke.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071928] via-[#0b2538] to-[#1a140f] flex flex-col items-center justify-center p-6 text-sky-50 relative overflow-hidden">
      <div className="absolute top-[-15%] left-[-10%] w-[520px] h-[520px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[520px] h-[520px] bg-amber-700/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md rounded-3xl bg-[#0e293d]/85 backdrop-blur-xl border border-amber-700/35 shadow-2xl p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-200 text-xs font-semibold">
            Relive • Oaza Mira i Samoregulacije
          </span>
          <h1 className="text-3xl font-black tracking-tight text-white">Udahni. Uspori.</h1>
          <p className="text-xs text-sky-200/80 leading-relaxed">
            Testiraj umirujuću frekvenciju pre nego što uđeš u svoj lični prostor za smanjenje stresa.
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1b140e]/80 border border-amber-700/40 space-y-2">
          <div className="text-[11px] font-bold text-amber-200/90 text-center">
            Testiraj zvuk za opuštanje (Hz)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleTestFreq(432)} className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${playingFreq === 432 ? "bg-sky-400 text-slate-950 border-sky-300" : "bg-[#0a1f30] text-sky-100 border-sky-700/40 hover:border-sky-400"}`}>
              {playingFreq === 432 ? "Zaustavi 432 Hz" : "432 Hz • Duboki mir"}
            </button>
            <button type="button" onClick={() => handleTestFreq(528)} className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${playingFreq === 528 ? "bg-amber-400 text-slate-950 border-amber-300" : "bg-[#0a1f30] text-amber-100 border-amber-700/40 hover:border-amber-400"}`}>
              {playingFreq === 528 ? "Zaustavi 528 Hz" : "528 Hz • Balans & fokus"}
            </button>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-sky-200/80 mb-1">E-mail adresa</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@domen.com" className="w-full bg-[#071826] border border-sky-800/60 focus:border-sky-400 rounded-xl p-3.5 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sky-200/80 mb-1">Lozinka</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#071826] border border-sky-800/60 focus:border-sky-400 rounded-xl p-3.5 text-sm text-white focus:outline-none" />
          </div>
          {errorMsg && <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/30 p-3 rounded-xl">{errorMsg}</p>}
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-400 to-teal-300 hover:from-sky-300 hover:to-teal-200 text-slate-950 font-black text-sm transition shadow-lg">
            {loading ? "Otvaram prostor mira..." : "Prijavi se u Relive"}
          </button>
        </form>

        <div className="text-center text-xs text-sky-200/80 pt-1">
          Nemaš nalog?{" "}
          <Link href="/register" className="text-amber-300 font-bold underline hover:text-amber-200">
            Registruj se besplatno
          </Link>
        </div>
      </div>
    </div>
  );
}
