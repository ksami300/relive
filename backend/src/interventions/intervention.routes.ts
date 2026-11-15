import { Router, Request, Response, NextFunction } from 'express';
import { InterventionController } from './intervention.controller';
import { InterventionLearningService } from '../intelligence/InterventionLearningService';
import { protect } from '../shared/middlewares/auth.middleware';
import { validate } from '../shared/middlewares/validation.middleware';
import { ApiResponse } from '../shared/utils/api-response';
import { z } from 'zod';

const router = Router();
const outcomeValidation = z.object({
  params: z.object({ id: z.string().regex(/^[1-9]\d*$/) }),
  body: z.object({
    stressAfter: z.preprocess(
      (value) => typeof value === 'string' && value.trim() !== '' ? Number(value) : value,
      z.number().finite().min(0).max(100)
    ),
    completed: z.boolean(),
    feedback: z.string().trim().min(1).max(256)
  }).strict()
});

// Nova pametna ruta koja klijentu izbacuje preporuku na osnovu personalizovanog ranga uspešnosti
router.get('/recommended', protect as any, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const preporuka = await InterventionLearningService.preuzmiNajboljuPreporuku(userId);
    return res.status(200).json(ApiResponse.success('Personalizovana preporuka uspesno generisana.', preporuka));
  } catch (err) {
    next(err);
  }
});

router.get('/active', protect as any, InterventionController.preuzmiAktivne as any);
router.post('/:id/outcome', protect as any, validate(outcomeValidation), InterventionController.evidentirajIshod as any);

export default router;
