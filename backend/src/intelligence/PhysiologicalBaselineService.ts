import { prisma } from '../config/db';

export interface PersonalPhysioBaseline {
  avgHRV: number;
  avgRHR: number;
  avgSleep: number;
}

export class PhysiologicalBaselineService {
  static async izracunajLiniBiometrijskiProsek(userId: number): Promise<PersonalPhysioBaseline> {
    const preCetrnaestDana = new Date();
    preCetrnaestDana.setDate(preCetrnaestDana.getDate() - 14);

    // Izvlačimo prosek svih fizioloških markera radnika u poslednje dve nedelje
    const agregat = await prisma.physiologicalEvent.aggregate({
      where: {
        userId,
        timestamp: { gte: preCetrnaestDana }
      },
      _avg: {
        hrv: true,
        restingHeartRate: true,
        sleepMinutes: true
      }
    });

    // Failsafe fallback vrednosti ako je radnik tek povezao wearable i nema dovoljno longitudinalne istorije
    return {
      avgHRV: agregat._avg.hrv || 55,
      avgRHR: agregat._avg.restingHeartRate || 68,
      avgSleep: agregat._avg.sleepMinutes || 420
    };
  }
}
