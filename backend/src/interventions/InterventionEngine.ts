import { prisma } from '../config/db';
import { StressIntelligenceService } from '../intelligence/StressIntelligenceService';
import { WebSocketServer } from '../config/websocket';

export class InterventionEngine {
  static async procesuirajPulsStresa(userId: number, organizationId: number | null, stressLogId: number, trenutniStres: number) {
    const { baseline, threshold } = await StressIntelligenceService.izracunajAdaptivniPrag(userId);

    console.log('🧠 [ENGINE AUDIT] Provera stresnog signala je završena.');

    if (trenutniStres > threshold) {
      const devijacijaProcentualno = parseFloat((((trenutniStres - baseline) / baseline) * 100).toFixed(1));

      // Koristimo novi, precizni produkcijski model iz Prisma seme
      const intervention = await prisma.stressIntervention.create({
        data: {
          userId,
          organizationId,
          stressLogId,
          type: "RELIEVE_SESSION",
          recommendation: `Stress pattern odstupanje iznosi +${devijacijaProcentualno}%. Preporucuje se hitna 7 min Relieve Recovery sesija.`,
          status: "ACTIVE"
        }
      });

      if (organizationId !== null) {
        WebSocketServer.emitujB2B(organizationId, 'intervention:autonomna', {
          poruka: `Stress-pattern skener uocio odstupanje od baseline vrednosti. Aktiviran auto-recovery protokol.`,
          baseline,
          trenutniStres,
          devijacija: devijacijaProcentualno,
          intervention
        });
      }
    }
  }
}
