import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

const biometricFloodRegister = new Map<number, { count: number; resetTime: number }>();

export async function biometricRateLimiterShield(req: Request, res: Response, next: NextFunction) {
  const userId = (req as any).user?.id;
  
  if (!userId) {
    return next();
  }

  const trenutnoVreme = Date.now();
  const prozorBlokade = 60 * 1000;
  const maksimalnoZahteva = 3;

  const korisnickiZapis = biometricFloodRegister.get(userId);

  if (!korisnickiZapis) {
    if (biometricFloodRegister.size >= 10000) {
      for (const [id, record] of biometricFloodRegister) {
        if (trenutnoVreme > record.resetTime) biometricFloodRegister.delete(id);
      }
    }
    biometricFloodRegister.set(userId, {
      count: 1,
      resetTime: trenutnoVreme + prozorBlokade
    });
    return next();
  }

  if (trenutnoVreme > korisnickiZapis.resetTime) {
    korisnickiZapis.count = 1;
    korisnickiZapis.resetTime = trenutnoVreme + prozorBlokade;
    return next();
  }

  // 🚨 AKCIJA: Ako korisnik probije limit, aktiviramo Biometric Cache Fallback da sačuvamo telemetriju
  if (korisnickiZapis.count >= maksimalnoZahteva) {
    return next(new AppError('Prekoracili ste limit sinhronizacije. Pokusajte ponovo za minut.', 429, 'TOO_MANY_REQUESTS'));
  }

  korisnickiZapis.count++;
  next();
}
