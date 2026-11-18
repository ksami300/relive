"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { withAuth } from "../../hoc/withAuth";
import { posaljiStresPulsSaAmortizerom } from "../../lib/api";
import { soundEngine } from "../../lib/soundEngine";

interface CalmTask {
  id: string;
  level: "low" | "high";
  titleSr: string;
  titleEn: string;
  descSr: string;
  descEn: string;
  type: "breathing" | "action" | "journal";
}

const TASKS: CalmTask[] = [
  {
    id: "breath-10",
    level: "low",
    titleSr: "10 dubokih, sporih udaha",
    titleEn: "10 Deep, Slow Breaths",
    descSr: "Udahni polako kroz nos (4s), zadrži kratko (2s) i izdahni dugo kroz usta (6s). Klikni dugme ispod za svaki završeni udah.",
    descEn: "Inhale slowly through your nose (4s), hold briefly (2s), and exhale slowly (6s). Tap below after each breath.",
    type: "breathing",
  },
  {
    id: "walk-5",
    level: "low",
    titleSr: "Lagana šetnja od 5 minuta",
    titleEn: "5-Minute Mindful Walk",
    descSr: "Ustani od ekrana, prošetaj laganim tempom po sobi ili napolju i fokusiraj pogled na udaljene predmete.",
    descEn: "Step away from the screen, walk gently indoors or outside, and focus your eyes on distant objects.",
    type: "action",
  },
  {
    id: "gratitude-3",
    level: "low",
    titleSr: "Zapiši 3 stvari koje te trenutno smiruju",
    titleEn: "Write 3 Grounding Thoughts",
    descSr: "Prebaci misli iz glave na ekran. Napiši kratko šta ti sada prija ili na čemu si zahvalan.",
    descEn: "Move thoughts from your mind onto the screen. Write 3 small things that bring you calm right now.",
    type: "journal",
  },
  {
    id: "sprint-release",
    level: "high",
    titleSr: "Fizičko pražnjenje tenzije (kratko trčanje ili brzi hod)",
    titleEn: "Physical Tension Release (Short Run or Brisk Walk)",
    descSr: "Visok stres stvara višak adrenalina u mišićima. Istrči kratko, uradi 20 čučnjeva ili hodaj brzim tempom 3 minuta da telo sagori napetost.",
    descEn: "High stress floods muscles with adrenaline. Do a quick run, 20 squats, or a 3-minute brisk walk to burn off tension.",
    type: "action",
  },
  {
    id: "cold-water",
    level: "high",
    titleSr: "Hladna voda i glasno izdisanje (reset nervnog sistema)",
    titleEn: "Cold Water Face Splash & Vocal Exhale",
    descSr: "Umij lice hladnom vodom 20 sekundi ili pusti glasno, dugo izdisanje (ili vrisak u jastuk ako si sam) da aktiviraš vagus nerv i spustiš puls.",
    descEn: "Splash cold water on your face for 20 seconds or let out a deep audible sigh to activate your vagus nerve and lower heart rate.",
    type: "action",
  },
  {
    id: "brain-dump",
    level: "high",
    titleSr: "Izbaci sve što te pritiska u dnevnik olakšanja",
    titleEn: "Unfiltered Stress Dump Journal",
    descSr: "Napiši bez cenzure sve što te sada nervira ili opterećuje. Kada problem dobije reči, mozak prestaje da ga doživljava kao nepoznatu pretnju.",
    descEn: "Write down everything weighing on you right now without filtering. Naming the stressor reduces amygdala overload.",
    type: "journal",
  },
];

function UserDashboardPage() {
  const { user, logout } = useAuth();
  const [lang, setLang] = useState<"SR" | "EN">("SR");
  const [step, setStep] = useState<"assess" | "exercise" | "recheck">("assess");
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [taskIndex, setTaskIndex] = useState<number>(0);
  const [breathCount, setBreathCount] = useState<number>(0);
  const [journalText, setJournalText] = useState<string>("");
  const [playingFreq, setPlayingFreq] = useState<number | null>(null);
  const [statusNote, setStatusNote] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    return () => soundEngine.stop();
  }, []);

  const handleToggleSound = (freq: number) => {
    const active = soundEngine.toggle(freq);
    setPlayingFreq(active ? freq : null);
  };

  const pool = TASKS.filter((t) => (stressLevel <= 5 ? t.level === "low" : t.level === "high"));
  const currentTask = pool[taskIndex % pool.length] || TASKS[0];

  const handleStartSession = async () => {
    setSaving(true);
    setBreathCount(0);
    setJournalText("");
    try {
      await posaljiStresPulsSaAmortizerom(stressLevel * 10);
    } catch {}
    setSaving(false);
    setStep("exercise");
  };

  const handleSwapTask = () => {
    setTaskIndex((prev) => prev + 1);
    setBreathCount(0);
    setJournalText("");
  };

  const handleFinishExercise = () => {
    setStep("recheck");
  };

  const handleRecheckSubmit = async () => {
    setSaving(true);
    try {
      await posaljiStresPulsSaAmortizerom(stressLevel * 10);
    } catch {}
    setSaving(false);

    if (stressLevel >= 5) {
      setTaskIndex((prev) => prev + 1);
      setBreathCount(0);
      setJournalText("");
      setStatusNote(
        lang === "SR"
          ? `Zabeleženo (${stressLevel}/10 — ${stressLevel * 10}%). Pošto je stres i dalje prisutan, prelazimo na drugi realan način za smirenje.`
          : `Recorded (${stressLevel}/10 — ${stressLevel * 10}%). Since stress is still elevated, let's try a different practical technique.`
      );
      setStep("exercise");
    } else {
      setStatusNote(
        lang === "SR"
          ? `Odlično! Tvoj stres je spušten na ${stressLevel}/10 (${stressLevel * 10}%). Nastavi u ovom mirnom ritmu.`
          : `Great job! Your stress is down to ${stressLevel}/10 (${stressLevel * 10}%). Enjoy this calm state.`
      );
      setStep("assess");
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#071928] via-[#0b2538] to-[#1c150f] text-sky-50 p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-3xl bg-[#0e293d]/85 border border-amber-700/40 shadow-xl">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-sky-300">Relive • Prostor Mira i Samoregulacije</span>
            <h1 className="text-2xl font-black text-white mt-0.5">{lang === "SR" ? `Zdravo, ${user?.name || "Prijatelju"}` : `Welcome, ${user?.name || "Friend"}`}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl bg-[#071826] p-1 border border-sky-800/50">
              <button type="button" onClick={() => setLang("SR")} className={`px-3 py-1 rounded-lg text-xs font-bold ${lang === "SR" ? "bg-sky-400 text-slate-950" : "text-sky-300"}`}>SR</button>
              <button type="button" onClick={() => setLang("EN")} className={`px-3 py-1 rounded-lg text-xs font-bold ${lang === "EN" ? "bg-sky-400 text-slate-950" : "text-sky-300"}`}>EN</button>
            </div>
            <button type="button" onClick={() => { soundEngine.stop(); logout(); }} className="px-4 py-2 rounded-xl bg-[#1b140e] border border-amber-700/40 text-amber-200 hover:text-rose-300 text-xs font-bold">
              {lang === "SR" ? "Odjava" : "Logout"}
            </button>
          </div>
        </header>

        <div className="p-5 rounded-3xl bg-[#1b140e]/85 border border-amber-700/45 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-amber-200">{lang === "SR" ? "Zvučna podrška (Hz) • Isključeno dok ne klikneš" : "Sound Support (Hz) • Off until you tap"}</h2>
              <p className="text-xs text-amber-100/75">{lang === "SR" ? "Napomena: Zvuk nikada ne kreće sam. Uključi ga samo ako ti prija tiha frekvencija." : "Note: Audio never auto-plays. Enable only if a gentle tone feels comfortable."}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => handleToggleSound(432)} className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${playingFreq === 432 ? "bg-sky-400 text-slate-950 border-sky-300" : "bg-[#0a1f30] text-sky-100 border-sky-700/50"}`}>
                {playingFreq === 432 ? (lang === "SR" ? "Zaustavi 432 Hz" : "Stop 432 Hz") : "432 Hz"}
              </button>
              <button type="button" onClick={() => handleToggleSound(528)} className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${playingFreq === 528 ? "bg-amber-400 text-slate-950 border-amber-300" : "bg-[#0a1f30] text-amber-100 border-amber-700/50"}`}>
                {playingFreq === 528 ? (lang === "SR" ? "Zaustavi 528 Hz" : "Stop 528 Hz") : "528 Hz"}
              </button>
            </div>
          </div>
        </div>

        {statusNote && (
          <div className="p-4 rounded-2xl bg-teal-950/70 border border-teal-400/40 text-teal-100 text-xs font-semibold">
            {statusNote}
          </div>
        )}
        {step === "assess" && (
          <div className="p-7 rounded-3xl bg-[#0e293d]/85 border border-sky-700/40 shadow-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">{lang === "SR" ? "Koliki je tvoj nivo stresa u ovom trenutku?" : "What is your stress level right now?"}</h3>
              <p className="text-xs text-sky-200/80">{lang === "SR" ? "Izaberi broj od 1 (potpuni mir) do 10 (jak pritisak). Aplikacija bira realan psihološki korak za tebe." : "Choose from 1 (calm) to 10 (intense stress). We will match a practical step for you."}</p>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button key={num} type="button" onClick={() => setStressLevel(num)} className={`py-3 rounded-xl font-black text-sm border transition ${stressLevel === num ? (num <= 5 ? "bg-sky-400 text-slate-950 border-sky-200 scale-105" : "bg-amber-400 text-slate-950 border-amber-200 scale-105") : "bg-[#071826] text-sky-100 border-sky-800/50 hover:border-sky-400"}`}>
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-sky-200/80 font-semibold">
              <span>1 = {lang === "SR" ? "Mirno (10%)" : "Calm (10%)"}</span>
              <span className="text-amber-300 font-bold">{lang === "SR" ? `Izabrano: ${stressLevel}/10 (${stressLevel * 10}%)` : `Selected: ${stressLevel}/10 (${stressLevel * 10}%)`}</span>
              <span>10 = {lang === "SR" ? "Visok stres (100%)" : "High Stress (100%)"}</span>
            </div>
            <button type="button" onClick={handleStartSession} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-400 to-teal-300 hover:from-sky-300 hover:to-teal-200 text-slate-950 font-black text-sm transition shadow-lg">
              {saving ? "..." : (lang === "SR" ? "Predloži moj korak za smirenje" : "Start My Calming Step")}
            </button>
          </div>
        )}

        {step === "exercise" && (
          <div className="p-7 rounded-3xl bg-[#0e293d]/90 border border-amber-700/45 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-bold">
                {lang === "SR" ? `Nivo stresa: ${stressLevel}/10 (${stressLevel * 10}%)` : `Stress Level: ${stressLevel}/10 (${stressLevel * 10}%)`}
              </span>
              <button type="button" onClick={handleSwapTask} className="text-xs font-bold text-sky-300 underline hover:text-white">
                {lang === "SR" ? "Ne mogu ovo sada — daj mi drugi način" : "Can't do this now — give me another way"}
              </button>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">{lang === "SR" ? currentTask.titleSr : currentTask.titleEn}</h3>
              <p className="text-sm text-sky-100/90 leading-relaxed">{lang === "SR" ? currentTask.descSr : currentTask.descEn}</p>
            </div>
            {currentTask.type === "breathing" && (
              <div className="p-5 rounded-2xl bg-[#071826] border border-sky-700/40 text-center space-y-4">
                <div className="text-3xl font-black text-sky-300">{breathCount} / 10</div>
                <button type="button" onClick={() => setBreathCount((c) => Math.min(10, c + 1))} className="px-6 py-3 rounded-2xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs uppercase tracking-wider">
                  {breathCount < 10 ? (lang === "SR" ? "Zabeleži dubok udah +1" : "Log Deep Breath +1") : (lang === "SR" ? "Svih 10 udaha završeno!" : "All 10 Breaths Done!")}
                </button>
              </div>
            )}
            {currentTask.type === "journal" && (
              <textarea rows={4} value={journalText} onChange={(e) => setJournalText(e.target.value)} placeholder={lang === "SR" ? "Napiši ovde svoje misli (ostaje samo za tebe)..." : "Write your thoughts here (private to you)..."} className="w-full p-4 rounded-2xl bg-[#071826] border border-sky-700/40 text-sm text-white focus:outline-none" />
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button type="button" onClick={handleFinishExercise} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-teal-300 text-slate-950 font-black text-sm">
                {lang === "SR" ? "Završio sam — proceni stres ponovo" : "Done — Re-check Stress Level"}
              </button>
              <button type="button" onClick={handleSwapTask} className="py-3.5 px-5 rounded-2xl bg-[#1b140e] border border-amber-700/50 text-amber-200 font-bold text-xs">
                {lang === "SR" ? "Zameni zadatak" : "Try Another Method"}
              </button>
            </div>
          </div>
        )}

        {step === "recheck" && (
          <div className="p-7 rounded-3xl bg-[#0e293d]/90 border border-sky-600/45 shadow-xl space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-white">{lang === "SR" ? "Kako se sada osećaš posle vežbe? (1–10)" : "How do you feel after the exercise? (1–10)"}</h3>
              <p className="text-xs text-sky-200/80">{lang === "SR" ? "Ako je broj i dalje 5 (50%) ili 6 (60%)+, odmah ti dajemo drugi, drugačiji psihološki način za smanjenje tenzije." : "If your number is still 5 (50%) or 6 (60%)+, we will immediately give you another technique."}</p>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button key={num} type="button" onClick={() => setStressLevel(num)} className={`py-3 rounded-xl font-black text-sm border transition ${stressLevel === num ? "bg-teal-300 text-slate-950 border-white scale-105" : "bg-[#071826] text-sky-100 border-sky-800/50"}`}>
                  {num}
                </button>
              ))}
            </div>
            <button type="button" onClick={handleRecheckSubmit} disabled={saving} className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-300 to-sky-400 text-slate-950 font-black text-sm">
              {saving ? "..." : (lang === "SR" ? "Potvrdi novi nivo stresa" : "Confirm Updated Stress Level")}
            </button>
          </div>
        )}

        <div className="text-[11px] text-sky-200/60 text-center px-4">
          {lang === "SR" ? "Napomena: Relive je visokotehnološki alat za samoregulaciju i opuštanje (ne zamenjuje psihologa ili lekara)." : "Disclaimer: Relive is a high-tech self-regulation tool (does not replace professional therapy or medical care)."}
        </div>
      </div>
    </div>
  );
}

export default withAuth(UserDashboardPage);
