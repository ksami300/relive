import { prisma } from '../../config/db';
import { FitbitProvider } from './providers/FitbitProvider';
import { AppError } from '../../shared/utils/app-error';
import { HealthEventInput, HealthProvider } from '../schemas/health-event.schema';

export class WearableSyncService {
  static async izvrsiHronoloskiSink(userId: number, providerName: "FITBIT") {
    // 1. CONSENT SHIELD: Stroga provera pristanka pre nego što podaci dotaknu memoriju
    const integracija = await prisma.healthIntegration.findUnique({
      where: { userId_provider: { userId, provider: providerName } }
    });

    if (!integracija || integracija.accessStatus !== 'ACTIVE') {
      throw new AppError('Biometrijska integracija je istekla ili je pristanak povucen.', 400, 'BAD_REQUEST');
    }

    const provajder = new FitbitProvider();
    const siroviPodaci = await provajder.preuzmiSiroveDogadjaje(userId);
    const kanonskiDogadjaji = provajder.normalizuj(userId, siroviPodaci);

    let upisaniGrof = 0;

    for (const event of kanonskiDogadjaji) {
      // 2. IDEMPOTENCY GATE: Filtriramo duplikate
      const postojeci = await prisma.physiologicalEvent.findFirst({
        where: { userId, timestamp: event.timestamp, source: providerName }
      });

      if (!postojeci) {
        await prisma.physiologicalEvent.create({
          data: {
            userId,
            integrationId: integracija.id,
            timestamp: event.timestamp,
            heartRate: event.heartRate,
            restingHeartRate: event.restingHeartRate,
            hrv: event.hrv,
            sleepMinutes: event.sleepMinutes,
            steps: event.steps,
            source: providerName
          }
        });
        upisaniGrof++;
      }
    }

    await prisma.healthIntegration.update({
      where: { id: integracija.id },
      data: { lastSyncAt: new Date() }
    });

    console.log(`🔋 [BATCH INGESTION] Uspesno obradjen niz. Upisano ${upisaniGrof} novih biometrijskih markera.`);
    return { success: true, upisano: upisaniGrof };
  }

  // 🚨 MEGALOMANSKI BATCH PRIHVATNIK: Dozvoljava eksternim platformama masovni upload istorije tela radnika
  static async ugutajMasovniNizDogadjaja(userId: number, dogadjaji: HealthEventInput[]): Promise<number> {
    const providers = [...new Set(dogadjaji.map((event) => event.source))] as HealthProvider[];
    const consents = await Promise.all(providers.map((provider) =>
      prisma.healthDataConsent.findUnique({
        where: { userId_provider: { userId, provider } }
      })
    ));

    if (consents.some((consent) => !consent?.granted)) {
      throw new AppError('Biometrijski unos je blokiran jer saglasnost nedostaje ili je opozvana.', 403, 'CONSENT_REQUIRED');
    }

    const integrations = new Map<HealthProvider, { id: number }>();
    for (const provider of providers) {
      const integration = await prisma.healthIntegration.upsert({
        where: { userId_provider: { userId, provider } },
        create: { userId, provider, accessStatus: 'ACTIVE' },
        update: { accessStatus: 'ACTIVE' }
      });
      integrations.set(provider, integration);
    }

    let uspesnoUpisano = 0;
    for (const ev of dogadjaji) {
      const timestamp = new Date(ev.timestamp);
      const postojeci = await prisma.physiologicalEvent.findFirst({
        where: { userId, timestamp, source: ev.source }
      });

      if (!postojeci) {
        const integration = integrations.get(ev.source);
        if (!integration) {
          throw new AppError('Integracija za biometrijski izvor nije dostupna.', 500, 'INTEGRATION_UNAVAILABLE');
        }
        await prisma.physiologicalEvent.create({
          data: {
            userId,
            integrationId: integration.id,
            timestamp,
            heartRate: ev.heartRate,
            restingHeartRate: ev.restingHeartRate,
            hrv: ev.hrv,
            sleepMinutes: ev.sleepMinutes,
            steps: ev.steps,
            source: ev.source
          }
        });
        uspesnoUpisano++;
      }
    }
    return uspesnoUpisano;
  }
}
