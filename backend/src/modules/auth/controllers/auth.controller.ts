import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiResponse } from '../../../shared/utils/api-response';

export class AuthController {
  static register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await AuthService.register(req.body);
      return res.status(201).json(
        ApiResponse.success('Korisnik uspesno registrovan unutar Relieve sistema.', data)
      );
    } catch (err) {
      next(err);
    }
  };

  static login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await AuthService.login(req.body);
      return res.status(200).json(
        ApiResponse.success('Autorizacija uspesna. Zen sesija otkljucana.', data)
      );
    } catch (err) {
      next(err);
    }
  };

  static refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;
      const data = await AuthService.refresh(token);
      return res.status(200).json(
        ApiResponse.success('Bezbednosni token uspesno rotiran i osvezen.', data)
      );
    } catch (err) {
      next(err);
    }
  };

  static logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await AuthService.logout(req.body.token);
      return res.status(200).json(ApiResponse.success('Sesija je uspesno opozvana.', null));
    } catch (err) {
      next(err);
    }
  };
}
