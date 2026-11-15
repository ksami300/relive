import { prisma } from '../config/db';
import { StressIntelligenceService } from './StressIntelligenceService';
import { PhysiologicalBaselineService } from './PhysiologicalBaselineService';

export interface FusionOutput {
  stressSignal: number;
  confidence: number;
  anomaly: boolean;
  contributingSignals: string[];
}

export class StressSignalFusionService {
  static async izvrsiMultiSignalProcenu(userId: number, trenutniSelfReport: number): Promise<FusionOutput> {
    // 1. Povlačimo psihološki baseline i adaptivni prag anomalije stresa
    const { baseline, threshold } = await StressIntelligenceService.izracunajAdaptivniPrag(userId);

    // 2. Dinamički računamo i izvlačimo stvarni biološki prosek ovog radnika u poslednjih 14 dana!
    const bioBaseline = await PhysiologicalBaselineService.izracunajLiniBiometrijskiProsek(userId);

    // 3. Hvatamo najsvežiji uneti wearable događaj iz Docker baze podataka
    const najsvezijiEvent = await prisma.physiologicalEvent.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });

    let korigovaniSignal = trenutniSelfReport;
    let confidence = 0.70;
    const contributingSignals: string[] = ["SELF_REPORT"];

    if (najsvezijiEvent) {
      // 🧠 ADAPTIVNA MULTI-SIGNAL PROCENA: Upoređujemo podatke isključivo sa ličnim biološkim prosekom radnika!
      
      // Ako je trenutni HRV niži od radnikovog ličnog dvonedeljnog proseka
      if (najsvezijiEvent.hrv && najsvezijiEvent.hrv < bioBaseline.avgHRV) {
        const hrvOdstupanje = parseFloat(((bioBaseline.avgHRV - najsvezijiEvent.hrv) / bioBaseline.avgHRV * 100).toFixed(1));
        korigovaniSignal += 12;
        confidence += 0.08;
        contributingSignals.push(`LOW_HRV_DETECTED_DEVIATION_${hrvOdstupanje}%`);
      }

      // Ako je trenutni puls u mirovanju povišen u odnosu na radnikov lični baseline pulsa
      if (najsvezijiEvent.restingHeartRate && najsvezijiEvent.restingHeartRate > bioBaseline.avgRHR) {
        const rhrOdstupanje = parseFloat(((najsvezijiEvent.restingHeartRate - bioBaseline.avgRHR) / bioBaseline.avgRHR * 100).toFixed(1));
        korigovaniSignal += 8;
        confidence += 0.07;
        contributingSignals.push(`ELEVATED_RHR_DETECTED_DEVIATION_${rhrOdstupanje}%`);
      }

      // Ako je radnik odspavao manje minuta nego što iznosi njegov uobičajeni baseline sna
      if (najsvezijiEvent.sleepMinutes && najsvezijiEvent.sleepMinutes < bioBaseline.avgSleep) {
        korigovaniSignal += 10;
        confidence += 0.05;
        contributingSignals.push("SLEEP_DEPRIVATION_BELOW_PERSONAL_BASELINE");
      }
    }

    if (korigovaniSignal > 100) korigovaniSignal = 100;
    
    // Anomalija se pali isključivo ako fuzionirani signal probije adaptivni prag
    const isAnomaly = korigovaniSignal > threshold;

    console.log('🧠 [BIOMETRIC FUSION] Procena signala je završena.');

    return {
      stressSignal: parseFloat(korigovaniSignal.toFixed(1)),
      confidence: parseFloat(Math.min(confidence, 1.0).toFixed(2)),
      anomaly: isAnomaly,
      contributingSignals
    };
  }
}
