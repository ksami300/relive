import { prisma } from '../config/db';

export class StressIntelligenceService {
  static async izracunajAdaptivniPrag(userId: number): Promise<{ baseline: number; threshold: number }> {
    const agregatStresa = await prisma.stressPulse.aggregate({
      where: { userId, organizationId: { not: null } },
      _avg: { stressLevel: true }
    });

    const personalBaseline = agregatStresa?._avg?.stressLevel || 50;

    // Sakupljamo istorijske ishode sesija da vidimo efikasnost za ovog radnika
    const istorijskiIshodi = await prisma.interventionOutcome.findMany({
      where: {
        intervention: { userId },
        completed: true
      },
      take: 5,
      orderBy: { measuredAt: 'desc' }
    });

    let prosecanPadStresa = 0;
    if (istorijskiIshodi.length > 0) {
      const sum = istorijskiIshodi.reduce((acc, curr) => acc + (curr.stressBefore - (curr.stressAfter || curr.stressBefore)), 0);
      prosecanPadStresa = sum / istorijskiIshodi.length;
    }

    // ADAPTIVNI PRAG: Ako sesije spuštaju stres preko 15%, sistem pooštrava senzore za detekciju anomalija
    let korigovaniPrag = personalBaseline * 1.25;
    if (prosecanPadStresa > 15) {
      korigovaniPrag = personalBaseline * 1.15;
      console.log('🧠 [ADAPTIVE BASELINE] Prag je prilagođen na osnovu istorijskih ishoda.');
    }

    return {
      baseline: parseFloat(personalBaseline.toFixed(2)),
      threshold: parseFloat(korigovaniPrag.toFixed(2))
    };
  }
}
