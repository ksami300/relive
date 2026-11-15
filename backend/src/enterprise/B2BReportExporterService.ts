import { prisma } from '../config/db';
import { CorporateService } from '../modules/corporate/services/corporate.service';

export class B2BReportExporterService {
  static async generisiMesecniIzvestaj(organizationId: number): Promise<string> {
    const svedocanstvo = await CorporateService.preuzmiZbirniZdravstveniIndex(organizationId);
    const licence = await CorporateService.preuzmiMetrikuKapaciteta(organizationId);
    const datumGenerisanja = new Date().toLocaleDateString('sr-RS');
    const calculatedSavings = Math.round(licence.activeSeats * (100 - svedocanstvo.stressScore) * 1.85);
    const netProfitROI = calculatedSavings - (svedocanstvo.aktivniStabilizatori * 49);

    return `======================================================================
                 RELIEVE EXECUTIVE B2B METRIC REPORT
======================================================================
Datum generisanja: ${datumGenerisanja}
Organizacija ID:   #${organizationId}
Licencni kapacitet: ${licence.activeSeats} / ${licence.seatLimit} aktivnih mesta
----------------------------------------------------------------------
Zdravstveni indeks kolektiva: ${svedocanstvo.healthScore}%
Zbirni faktor stresa firme:   ${svedocanstvo.stressScore}%
NETO ROI PROFIL PLATFORME:     +${netProfitROI} EUR
======================================================================`;
  }
}
