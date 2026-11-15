import { Router, Request, Response, NextFunction } from 'express';
import { protect } from '../../../shared/middlewares/auth.middleware';
import { requireOrganizationMembership } from '../../../shared/middlewares/organization-access.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { prisma } from '../../../config/db';
import { InterventionEngine } from '../../../interventions/InterventionEngine';
import { ApiResponse } from '../../../shared/utils/api-response';
import { stresPulsSchema } from '../stress.validation';
import { StressController } from '../controllers/stress.controller';

const router = Router();

router.post('/personal/log', protect as any, validate(stresPulsSchema), StressController.zabeleziLicniPuls);
router.get('/personal/history', protect as any, StressController.preuzmiLicnuIstoriju);

router.post('/log', protect as any, validate(stresPulsSchema), requireOrganizationMembership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const organizationId = (req as any).user.organizationId;
    if (!organizationId) {
      throw new Error('Token nema organizacioni opseg.');
    }
    const { stressLevel } = req.body;

    const noviPuls = await prisma.stressPulse.create({
      data: {
        userId,
        organizationId,
        stressLevel
      }
    });

    // 🧠 AUTOMATSKO PRESRETANJE: Aktivacija pametnog motora koji uči iz Baseline navika radnika
    InterventionEngine.procesuirajPulsStresa(userId, organizationId, noviPuls.id, stressLevel).catch(err => {
      console.error('⚠️ [ENGINE ERROR] Asinhrona analiza stresa nije uspela.');
    });

    return res.status(201).json(ApiResponse.success('Dnevni stress check-in uspesno zabelezen.', noviPuls));
  } catch (err) {
    next(err);
  }
});

export default router;
