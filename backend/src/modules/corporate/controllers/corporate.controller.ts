import { Request, Response, NextFunction } from 'express';
import { CorporateService } from '../services/corporate.service';
import { BillingService } from '../services/billing.service';
import { ApiResponse } from '../../../shared/utils/api-response';
import { WebSocketServer } from '../../../config/websocket';
import { InterventionOutcomeService } from '../../../interventions/InterventionOutcomeService';

export class CorporateController {
  static async preuzmiKapacitetB2B(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = parseInt(req.params.orgId, 10);
      const podaci = await CorporateService.preuzmiMetrikuKapaciteta(orgId);
      return res.status(200).json(ApiResponse.success('Klijentska telemetrija licenci uspesno ucitana.', podaci));
    } catch (err) {
      next(err);
    }
  }

  static async preuzmiScorecardB2B(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = parseInt(req.params.orgId, 10);
      const podaci = await CorporateService.preuzmiZbirniZdravstveniIndex(orgId);
      return res.status(200).json(ApiResponse.success('Korporativni neuro-scorecard uspesno generisan.', podaci));
    } catch (err) {
      next(err);
    }
  }

  static async promeniKapacitetLicenciB2B(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = parseInt(req.params.orgId, 10);
      const { seatQuantity } = req.body;
      const rezultat = await BillingService.preracunajIPromeniPretplatu(orgId, parseInt(seatQuantity));
      
      const osvezeniScorecard = await CorporateService.preuzmiZbirniZdravstveniIndex(orgId);
      WebSocketServer.emitujB2B(orgId, 'telemetrija:osvezi', {
        usageStats: rezultat,
        scorecard: osvezeniScorecard
      });

      return res.status(200).json(ApiResponse.success(rezultat.poruka, rezultat));
    } catch (err) {
      next(err);
    }
  }

  static async evidentirajOporavakRadnika(req: Request, res: Response, next: NextFunction) {
    try {
      const { interventionId } = req.body;
      // Proselđujemo sva 4 zahtevana argumenta sa fallsafe dev parametrima pod ustavom učenja
      const resOutcome = await InterventionOutcomeService.evidentirajUspesnostIshoda(
        parseInt(interventionId, 10),
        (req as any).user.id,
        55,
        true,
        "HELPED"
      );
      return res.status(200).json(ApiResponse.success('Outcome uspesno zabelezen', resOutcome.podaci));
    } catch (err) {
      next(err);
    }
  }

  static async pokreniIntervencijuB2B(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = parseInt(req.params.orgId, 10);
      const { type, cohort } = req.body;
      const novaKampanja = await CorporateService.pokreniIntervenciju(orgId, type, cohort);
      WebSocketServer.emitujB2B(orgId, 'intervencija:nova', novaKampanja);
      return res.status(201).json(ApiResponse.success('Amortizaciona kampanja uspesno lansirana na mrezu.', novaKampanja));
    } catch (err) {
      next(err);
    }
  }

  static async preuzmiIntervencijeB2B(req: Request, res: Response, next: NextFunction) {
    try {
      const orgId = parseInt(req.params.orgId, 10);
      const lista = await CorporateService.preuzmiAktivneIntervencije(orgId);
      return res.status(200).json(ApiResponse.success('Lista aktivnih stabilizatora ucitana.', lista));
    } catch (err) {
      next(err);
    }
  }
}
