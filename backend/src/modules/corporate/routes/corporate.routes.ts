import { Router } from 'express';
import { CorporateController } from '../controllers/corporate.controller';
import { protect } from '../../../shared/middlewares/auth.middleware';
import { validate } from '../../../shared/middlewares/validation.middleware';
import { requireOrganizationMembership } from '../../../shared/middlewares/organization-access.middleware';
import { azurirajMestaSchema, pokreniKampanjuSchema } from '../corporate.validation';

const router = Router();

router.get('/:orgId/billing/usage', protect as any, requireOrganizationMembership, CorporateController.preuzmiKapacitetB2B as any);
router.get('/:orgId/scorecard', protect as any, requireOrganizationMembership, CorporateController.preuzmiScorecardB2B as any);
router.post('/organizations/:orgId/seats', protect as any, requireOrganizationMembership, validate(azurirajMestaSchema), CorporateController.promeniKapacitetLicenciB2B as any);
router.post('/:orgId/interventions', protect as any, requireOrganizationMembership, validate(pokreniKampanjuSchema), CorporateController.pokreniIntervencijuB2B as any);
router.get('/:orgId/interventions/active', protect as any, requireOrganizationMembership, CorporateController.preuzmiIntervencijeB2B as any);

// 🔄 RUTA ZA EVIDENTIRANJE RECOVERY ISHODA STRESA
router.post('/:orgId/interventions/recovery', protect as any, requireOrganizationMembership, CorporateController.evidentirajOporavakRadnika as any);

export default router;
