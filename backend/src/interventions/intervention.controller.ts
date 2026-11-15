import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { InterventionOutcomeService } from './InterventionOutcomeService';
import { ApiResponse } from '../shared/utils/api-response';

export class InterventionController {
  static async preuzmiAktivne(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const liste = await prisma.stressIntervention.findMany({
        where: { userId, status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      });
      return res.status(200).json(ApiResponse.success('Aktivne personalne intervencije ucitane.', liste));
    } catch (err) {
      next(err);
    }
  }

  static async evidentirajIshod(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const { stressAfter, completed, feedback } = req.body;

      const rezultat = await InterventionOutcomeService.evidentirajUspesnostIshoda(
        id,
        (req as any).user.id,
        parseFloat(stressAfter),
        completed,
        feedback
      );

      return res.status(200).json(ApiResponse.success('Outcome uspesno zabelezen', rezultat.podaci));
    } catch (err) {
      next(err);
    }
  }
}
