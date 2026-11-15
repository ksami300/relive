import { Router, Request, Response, NextFunction } from 'express';
import { OrganizationInterventionService } from '../enterprise/OrganizationInterventionService';
import { B2BReportExporterService } from '../enterprise/B2BReportExporterService';
import { PredictiveAnalyticsService } from '../enterprise/PredictiveAnalyticsService';
import { AutonomousResolutionService } from '../enterprise/AutonomousResolutionService';
import { protect } from '../shared/middlewares/auth.middleware';
import { requireOrganizationMembership } from '../shared/middlewares/organization-access.middleware';
import { ApiResponse } from '../shared/utils/api-response';

const router = Router();

router.get('/:organizationId/interventions/effectiveness', protect as any, requireOrganizationMembership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = parseInt(req.params.organizationId, 10);
    const podaci = await OrganizationInterventionService.preuzmiMetrikuEfikasnosti(orgId);
    return res.status(200).json(ApiResponse.success('Metrika korporativne efikasnosti uspesno konsolidovana.', podaci));
  } catch (err) {
    next(err);
  }
});

router.get('/:organizationId/predictions', protect as any, requireOrganizationMembership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = parseInt(req.params.organizationId, 10);
    const predikcije = await PredictiveAnalyticsService.izracunajPrediktivniRizikB2B(orgId);
    return res.status(200).json(ApiResponse.success('Prediktivna B2B metrika uspesno izracunata.', predikcije));
  } catch (err) {
    next(err);
  }
});

// 🚨 NOVO: AUTONOMNA MREŽNA KAPIJA ZA TRIJAŽU I ZATVARANJE STABILIZOVANIH KAMPANJA
router.post('/:organizationId/report/resolve', protect as any, requireOrganizationMembership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = parseInt(req.params.organizationId, 10);
    await AutonomousResolutionService.proveriIZatvoriStabilizovaneKampanje(orgId);
    return res.status(200).json(ApiResponse.success('Sistemska trijaza i zatvaranje stabilizovanih kampanja uspesno izvrseni.', null));
  } catch (err) {
    next(err);
  }
});

router.get('/:organizationId/report/download', protect as any, requireOrganizationMembership, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = parseInt(req.params.organizationId, 10);
    const tekstIzvestaja = await B2BReportExporterService.generisiMesecniIzvestaj(orgId);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=Relieve_B2B_Executive_Report_Org_${orgId}.txt`);
    return res.status(200).send(tekstIzvestaja);
  } catch (err) {
    next(err);
  }
});

export default router;
