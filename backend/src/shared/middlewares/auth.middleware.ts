import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../shared/utils/app-error';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const protect = async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Pristup odbijen. Nedostaje bezbednosni token.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new AppError('JWT konfiguracija nije dostupna.', 500, 'CONFIGURATION_ERROR');
    }

    const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as any;

    if (!decoded?.userId && !decoded?.id) {
      throw new AppError('Token ne sadrzi korisnicki identitet.', 401, 'UNAUTHORIZED');
    }

    const userId = decoded.userId ?? decoded.id;
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new AppError('Token ne sadrzi validan korisnicki identitet.', 401, 'UNAUTHORIZED');
    }

    req.user = {
      ...decoded,
      id: userId,
      userId,
      organizationId: undefined,
    };
    next();
  } catch (err: any) {
    if (err instanceof AppError) return next(err);
    next(new AppError('Sesija je istekla ili je bezbednosni token nevazeci.', 401, 'UNAUTHORIZED'));
  }
};
