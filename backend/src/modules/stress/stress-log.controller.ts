import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { ApiResponse } from '../../shared/utils/api-response';
import crypto from 'crypto';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

const getEncryptionKey = () => {
  const encodedKey = process.env.STRESS_ENCRYPTION_KEY;
  if (!encodedKey) throw new Error('STRESS_ENCRYPTION_KEY nije konfigurisan.');

  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== 32) throw new Error('STRESS_ENCRYPTION_KEY mora biti base64 AES-256 kljuc.');
  return key;
};

export class StressLogController {
  static async zabeleziCheckInKorisnika(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const organizationId = (req as any).user?.organizationId;
      if (!userId || !organizationId) throw new Error('Autorizovani identitet nema obavezan opseg.');
      const { stressLevel, osecaj } = req.body;

      let tekstZaBazu = osecaj || "STABILNO";

      if (osecaj) {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, getEncryptionKey(), iv);
        const encrypted = Buffer.concat([cipher.update(osecaj, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();
        tekstZaBazu = `ENCRYPTED_GCM_${iv.toString('base64')}.${authTag.toString('base64')}.${encrypted.toString('base64')}`;
      }

      // 🔒 AR_M_I_R_A_N_I BAJPAS: Koristimo stabilnu tabelu stressIntervention sa tipom USER_CHECK_IN i cuvamo kriptovani osecaj u recommendation
      const noviLog = await prisma.stressIntervention.create({
        data: {
          organizationId,
          userId,
          stressLogId: parseInt(stressLevel) || 50, // Privremeno mapiramo jacinu stresa u vezni kljuc
          type: 'USER_CHECK_IN',
          status: 'COMPLETED',
          recommendation: tekstZaBazu // Sifrovane misli idu direktno u stabilno tekstualno polje!
        }
      });

      return res.status(201).json(ApiResponse.success('Dnevni check-in uspesno zaveden u zasticene registre.', noviLog));
    } catch (err) {
      next(err);
    }
  }
}
