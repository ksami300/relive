"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registracijaKorisnika } from "../../lib/api";

export default function CalmRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      if (res?.success) {
        setSuccessMsg("Tvoj nalog je spreman! Preusmeravam te na prijavu...");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        throw new Error(res?.message || "Registracija nije uspela.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Greška pri registraciji. Proverite podatke.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071928] via-[#0b2538] to-[#1a140f] flex flex-col items-center justify-center p-6 text-sky-50 relative overflow-hidden">
      <div className="w-full max-w-md rounded-3xl bg-[#0e293d]/85 backdrop-blur-xl border border-amber-700/35 shadow-2xl p-8 space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs font-semibold">
            Relive • Kreiraj Lični Prostor Mira
          </span>
          <h1 className="text-3xl font-black text-white">Započni Opuštanje</h1>
          <p className="text-xs text-sky-200/80">
            Napravi besplatan nalog za vođeno disanje, zvučne frekvencije i praćenje stresa.
          </p>
        </div>

        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-sky-200/80 mb-1">Ime</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Tvoje ime" className="w-full bg-[#071826] border border-sky-800/60 focus:border-sky-400 rounded-xl p-3.5 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sky-200/80 mb-1">E-mail adresa</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ime@domen.com" className="w-full bg-[#071826] border border-sky-800/60 focus:border-sky-400 rounded-xl p-3.5 text-sm text-white focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-sky-200/80 mb-1">Lozinka (min. 8 znakova, veliko slovo i broj)</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Npr. Relive2026" className="w-full bg-[#071826] border border-sky-800/60 focus:border-sky-400 rounded-xl p-3.5 text-sm text-white focus:outline-none" />
          </div>
          {errorMsg && <p className="text-xs text-rose-300 bg-rose-950/60 border border-rose-500/30 p-3 rounded-xl">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 p-3 rounded-xl">{successMsg}</p>}
          <button type="submit" disabled={loading} className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-400 to-teal-300 hover:from-sky-300 hover:to-teal-200 text-slate-950 font-black text-sm transition shadow-lg">
            {loading ? "Kreiram profil..." : "Kreiraj besplatan nalog"}
          </button>
        </form>

        <div className="text-center text-xs text-sky-200/80">
          Već imaš nalog?{" "}
          <Link href="/login" className="text-amber-300 font-bold underline">Prijavi se</Link>
        </div>
      </div>
    </div>
  );
}
