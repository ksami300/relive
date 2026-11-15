import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { HealthEventBatchSchema, HealthEventSchema, HealthProvider } from './schemas/health-event.schema';
import { WearableSyncService } from './wearable/WearableSyncService';
import { StressSignalFusionService } from '../intelligence/StressSignalFusionService';
import { InterventionEngine } from '../interventions/InterventionEngine';
import { ApiResponse } from '../shared/utils/api-response';

export class IntegrationController {
  static async unesiBiometrijskiDogadjaj(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const validiraniPayload = HealthEventSchema.parse(req.body);

      let integracija = await prisma.healthIntegration.findUnique({
        where: { userId_provider: { userId, provider: validiraniPayload.source } }
      });

      if (!integracija) {
        integracija = await prisma.healthIntegration.create({
          data: { userId, provider: validiraniPayload.source, accessStatus: "ACTIVE" }
        });
      }

      const finalRhr = validiraniPayload.restingHeartRate;

      const noviEvent = await prisma.physiologicalEvent.create({
        data: {
          userId,
          integrationId: integracija.id,
          timestamp: new Date(validiraniPayload.timestamp),
          heartRate: validiraniPayload.heartRate,
          restingHeartRate: finalRhr,
          hrv: validiraniPayload.hrv,
          sleepMinutes: validiraniPayload.sleepMinutes,
          steps: validiraniPayload.steps,
          source: validiraniPayload.source
        }
      });

      const fuzioniRezultat = await StressSignalFusionService.izvrsiMultiSignalProcenu(userId, 60);

      if (fuzioniRezultat.anomaly) {
        await InterventionEngine.procesuirajPulsStresa(userId, null, Number(noviEvent.id), fuzioniRezultat.stressSignal);
      }

      return res.status(201).json(ApiResponse.success('Biometrijski event uspesno procesuiran.', fuzioniRezultat));
    } catch (err) {
      next(err);
    }
  }

  static async unesiMasovniNizBiometrije(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { events } = HealthEventBatchSchema.parse(req.body);
      const upisanoKomada = await WearableSyncService.ugutajMasovniNizDogadjaja(userId, events);

      const referentniHrv = events[0]?.hrv;

      return res.status(200).json(ApiResponse.success('Masovni prenos uspesno prociscen i obradjen.', { 
        upisano: upisanoKomada, 
        level: referentniHrv !== undefined && referentniHrv < 48 ? 'LOW' : 'HIGH'
      }));
    } catch (err) {
      next(err);
    }
  }

  static async preuzmiStatusPristankaKlijent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const provider = (req.query.provider as HealthProvider | undefined) ?? "FITBIT";
      const pristanak = await prisma.healthDataConsent.findUnique({
        where: { userId_provider: { userId, provider } }
      });
      const statusPristanka = pristanak ?? {
        userId,
        provider,
        granted: false,
        grantedAt: null,
        revokedAt: null
      };

      return res.status(200).json(ApiResponse.success('Status pristanka uspesno ucitan.', statusPristanka));
    } catch (err) {
      next(err);
    }
  }

  static async azurirajStatusPristankaKlijent(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { granted, provider: requestedProvider } = req.body;
      const provider = (requestedProvider as HealthProvider | undefined) ?? "FITBIT";
      const consentTime = new Date();

      const azuriranPristanak = await prisma.healthDataConsent.upsert({
        where: { userId_provider: { userId, provider } },
        create: { userId, provider, granted, grantedAt: granted ? consentTime : null, revokedAt: granted ? null : consentTime },
        update: { granted, grantedAt: granted ? consentTime : null, revokedAt: granted ? null : consentTime }
      });

      await prisma.healthIntegration.upsert({
        where: { userId_provider: { userId, provider } },
        create: { userId, provider, accessStatus: granted ? "ACTIVE" : "REVOKED" },
        update: { accessStatus: granted ? "ACTIVE" : "REVOKED" }
      });

      return res.status(200).json(ApiResponse.success('Digitalni pristanak azuriran.', azuriranPristanak));
    } catch (err) {
      next(err);
    }
  }
}
