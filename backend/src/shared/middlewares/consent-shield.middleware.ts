import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { ApiResponse } from '../utils/api-response';
import { HealthProvider } from '../../integrations/schemas/health-event.schema';

export async function consentVerificationShield(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json(ApiResponse.error('Neautorizovan pristup.', 'UNAUTHORIZED'));
  }

  const providers = req.path === '/batch'
    ? [...new Set(((req.body?.events ?? []) as Array<{ source: HealthProvider }>).map((event) => event.source))]
    : [req.body?.source as HealthProvider | undefined].filter((provider): provider is HealthProvider => Boolean(provider));

  try {
    const consents = await Promise.all(providers.map((provider) =>
      prisma.healthDataConsent.findUnique({
        where: { userId_provider: { userId, provider } }
      })
    ));

    if (providers.length === 0 || consents.some((consent) => !consent?.granted)) {
      console.log('🔒 [CONSENT SHIELD] Biometrijski unos odbijen: saglasnost nedostaje ili je opozvana.');
      return res.status(403).json(
        ApiResponse.error('Ingestion blokiran. Za svaki izvor podataka potrebna je aktivna saglasnost.', 'FORBIDDEN')
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
}
