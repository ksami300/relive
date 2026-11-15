import { prisma } from '../../../config/db';
import { AppError } from '../../../shared/utils/app-error';

export class StressService {
  static async zabeleziLicniPuls(userId: number, stressLevel: number) {
    if (!Number.isInteger(stressLevel) || stressLevel < 0 || stressLevel > 100) {
      throw new AppError('Nivo stresa mora biti u opsegu od 0 do 100.', 400, 'INVALID_STRESS_LEVEL');
    }

    return prisma.stressPulse.create({
      data: {
        userId,
        stressLevel,
        organizationId: null
      }
    });
  }

  static async preuzmiLicnuIstoriju(userId: number) {
    return prisma.stressPulse.findMany({
      where: { userId, organizationId: null },
      take: 100,
      orderBy: { timestamp: 'desc' }
    });
  }

  static async zabeleziPuls(userId: number, stressLevel: number, organizationId?: number) {
    if (!Number.isInteger(stressLevel) || stressLevel < 0 || stressLevel > 100) {
      throw new AppError('Nivo stresa mora biti u opsegu od 0 do 100.', 400, 'INVALID_STRESS_LEVEL');
    }
    if (!Number.isInteger(organizationId) || Number(organizationId) <= 0) {
      throw new AppError('Provera clanstva u organizaciji nije dostupna.', 403, 'ORGANIZATION_MEMBERSHIP_REQUIRED');
    }

    const noviPuls = await prisma.stressPulse.create({
      data: {
        userId,
        stressLevel: parseFloat(stressLevel.toString()),
        organizationId: Number(organizationId)
      }
    });

    return noviPuls;
  }

  static async preuzmiAnalitikuKorisnika(userId: number) {
    const logovi = await prisma.stressPulse.findMany({
      where: { userId },
      take: 15,
      orderBy: { timestamp: 'desc' }
    });

    return logovi;
  }
}
