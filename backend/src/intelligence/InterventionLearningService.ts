import { prisma } from '../config/db';

export class InterventionLearningService {
  static async azurirajEfekatIntervencije(userId: number, interventionType: string, stressBefore: number, stressAfter: number, feedback: string) {
    // Primarni objektivni signal: promena stresa pre i posle sesije
    const stressDelta = stressBefore - stressAfter;
    const uspesno = stressDelta > 0 || feedback === 'HELPED';

    const postojecaEfikasnost = await prisma.interventionEffectiveness.findUnique({
      where: { userId_interventionType: { userId, interventionType } }
    });

    if (!postojecaEfikasnost) {
      await prisma.interventionEffectiveness.create({
        data: {
          userId,
          interventionType,
          attempts: 1,
          successful: uspesno ? 1 : 0,
          avgStressDelta: stressDelta,
          effectiveness: uspesno ? 1.0 : 0.0
        }
      });
    } else {
      const noviAttempts = postojecaEfikasnost.attempts + 1;
      const noviSuccessful = postojecaEfikasnost.successful + (uspesno ? 1 : 0);
      const novaAvgDelta = ((postojecaEfikasnost.avgStressDelta * postojecaEfikasnost.attempts) + stressDelta) / noviAttempts;
      const novaEfikasnost = noviSuccessful / noviAttempts;

      await prisma.interventionEffectiveness.update({
        where: { id: postojecaEfikasnost.id },
        data: {
          attempts: noviAttempts,
          successful: noviSuccessful,
          avgStressDelta: parseFloat(novaAvgDelta.toFixed(2)),
          effectiveness: parseFloat(novaEfikasnost.toFixed(2))
        }
      });
    }
    console.log('🧠 [AI LEARNING] Materijalizovani agregat je ažuriran.');
  }

  static async preuzmiNajboljuPreporuku(userId: number): Promise<{ type: string; confidence: number; reason: string }> {
    const rangLista = await prisma.interventionEffectiveness.findMany({
      where: { userId },
      orderBy: { effectiveness: 'desc' },
      take: 1
    });

    if (rangLista.length === 0 || rangLista[0].effectiveness < 0.5) {
      return {
        type: 'RELIEVE_SESSION',
        confidence: 0.75,
        reason: 'Preporuceno na osnovu opsteg korporativnog neuro-sablona.'
      };
    }

    return {
      type: rangLista[0].interventionType,
      confidence: rangLista[0].effectiveness,
      reason: `Dokazano najefikasniji modul za Vase biometrijske obrasce (Prosecan pad stresa: ${rangLista[0].avgStressDelta} poena).`
    };
  }
}
