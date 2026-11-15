"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { registracijaKorisnika } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cohort, setCohort] = useState("Engineering");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await registracijaKorisnika(email, password, name);
      if (res.success) {
        setSuccessMsg("✓ Profil uspešno uklesan u Relieve stenu! Preusmeravam na Zen prijavu...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        throw new Error(res.message || "Neuspesna registracija.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Greska na mrezi. Proverite backend.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#02040a] flex flex-col items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden">
      {/* NEURO FREKVENCIJE: Umirujuće neonske aure za smanjenje kortizola u očnom živcu */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '6s' }} />
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '9s' }} />

      <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-2xl border border-slate-800/40 rounded-3xl p-8 space-y-6 relative z-10 shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-pink-400/20 to-indigo-500/20 border border-indigo-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-2">
            <span className="text-xl">🧘‍♂️</span>
          </div>
          <span className="text-[10px] font-black uppercase text-pink-300 bg-pink-400/10 border border-pink-400/20 px-3 py-1 rounded-full tracking-widest inline-block">B2B Enrollment</span>
          <h2 className="text-2xl font-black bg-gradient-to-r from-slate-100 via-slate-300 to-slate-400 bg-clip-text text-transparent">Aktiviraj Zen Profil</h2>
          <p className="text-slate-400 text-xs leading-relaxed">Kreirajte nalog i instant povežite svoje parametre sa krovnom NutriFlow matricom.</p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tvoje Ime</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nemanja" className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none transition-colors" />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">E-mail Adresa</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@kompanija.com" className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Radna Kohorta (Sektor)</label>
            <select value={cohort} onChange={(e) => setCohort(e.target.value)} className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl p-3.5 text-xs text-slate-300 outline-none transition-colors">
              <option value="Engineering">Inzenjeri (Engineering)</option>
              <option value="Marketing">Marketing tim</option>
              <option value="Sales">Prodajni vod (Sales)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Sigurnosna Lozinka</label>
            <input type="password" required value={password} placeholder="••••••••" onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950/60 border border-slate-800/80 focus:border-indigo-500/40 rounded-xl p-3.5 text-xs text-slate-200 focus:outline-none transition-colors" />
          </div>

          {successMsg && <p className="text-xs text-emerald-400 bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl font-medium leading-relaxed">{successMsg}</p>}
          {errorMsg && <p className="text-xs text-rose-400 bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl font-medium leading-relaxed">⚠️ {errorMsg}</p>}

          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-500/20 to-pink-500/20 hover:from-indigo-500/30 hover:to-pink-500/30 text-cyan-300 border border-cyan-500/20 font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-[0.98]">
            {loading ? "Urezujem u registre..." : "Aktiviraj Zen Profil 🧘‍♂️"}
          </button>
        </form>

        <div className="text-center pt-2">
          <button type="button" onClick={() => router.push("/login")} className="text-[11px] text-slate-500 hover:text-indigo-400 font-medium transition-colors">Vec imate profil? Prijavite se ovde</button>
        </div>
      </div>
    </div>
  );
}
