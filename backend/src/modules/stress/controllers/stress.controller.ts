import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../shared/middlewares/auth.middleware';
import { StressService } from '../services/stress.service';
import { ApiResponse } from '../../../shared/utils/api-response';
import { AppError } from '../../../shared/utils/app-error';

export class StressController {
  static zabeleziLicniPuls = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new AppError('Korisnik nije identifikovan.', 401, 'UNAUTHORIZED'));

      const data = await StressService.zabeleziLicniPuls(req.user.userId, req.body.stressLevel);
      return res.status(201).json(ApiResponse.success('Licni stres zapis je sacuvan.', data));
    } catch (err) {
      next(err);
    }
  };

  static preuzmiLicnuIstoriju = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new AppError('Korisnik nije identifikovan.', 401, 'UNAUTHORIZED'));

      const data = await StressService.preuzmiLicnuIstoriju(req.user.userId);
      return res.status(200).json(ApiResponse.success('Licna istorija stres zapisa je ucitana.', data));
    } catch (err) {
      next(err);
    }
  };

  static zabeleziPuls = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new AppError('Korisnik nije identifikovan.', 401, 'UNAUTHORIZED'));
      
      const { stressLevel } = req.body;
      const data = await StressService.zabeleziPuls(req.user.userId, stressLevel, req.user.organizationId);
      
      return res.status(200).json(
        ApiResponse.success('Stres puls uspesno zabelezen unutar registra.', data)
      );
    } catch (err) {
      next(err);
    }
  };

  static preuzmiAnalitiku = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) return next(new AppError('Korisnik nije identifikovan.', 401, 'UNAUTHORIZED'));
      
      const data = await StressService.preuzmiAnalitikuKorisnika(req.user.userId);
      
      return res.status(200).json(
        ApiResponse.success('Longitudinalna analitika uspesno povucena.', data)
      );
    } catch (err) {
      next(err);
    }
  };
}
