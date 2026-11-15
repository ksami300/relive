import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const memoryCache = new Map<string, RateLimitRecord>();

export const rateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
    const key = `${req.originalUrl}_${ip}`;
    const now = Date.now();

    let record = memoryCache.get(key);

    if (!record) {
      // Inicijalizujemo novi zapis za ovu IP adresu na datoj ruti
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      memoryCache.set(key, record);
      return next();
    }

    if (now > record.resetTime) {
      // Vremenski prozor je istekao, resetujemo brojac
      record.count = 1;
      record.resetTime = now + windowMs;
      memoryCache.set(key, record);
      return next();
    }

    record.count++;
    memoryCache.set(key, record);

    if (record.count > maxRequests) {
      // IP adresa je prešla dozvoljeni limit, aktiviramo blokadu
      return next(new AppError('Previshe zahteva u kratkom vremenskom periodu. Pristup je privremeno blokiran.', 429, 'TOO_MANY_REQUESTS'));
    }

    next();
  };
};
