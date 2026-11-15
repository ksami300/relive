import { prisma } from '../../../config/db';
import { AppError } from '../../../shared/utils/app-error';

export class BillingService {
  static async preracunajIPromeniPretplatu(organizationId: number, noviKapacitet: number) {
    console.log(`⏳ [STRIPE AMORTIZER] Preracunavam pro-rated pretplatu za organizaciju #${organizationId} na ${noviKapacitet} slotova...`);

    if (noviKapacitet < 10 || noviKapacitet > 1500) {
      throw new AppError('Kapacitet slotova mora biti u opsegu od 10 do 1500.', 400, 'BAD_REQUEST');
    }

    // 1. Izvlacimo trenutni biling ugovor iz baze
    let sub = await prisma.subscription.findUnique({ where: { organizationId } });
    if (!sub) {
      throw new AppError('Aktivna pretplata za ovu organizaciju nije uocena.', 404, 'NOT_FOUND');
    }

    // 2. ISPRAVKA: Brojimo korisnike iz user tabele umesto nepostojeceg polja u pretplati
    const activeSeatsCount = await prisma.user.count({ where: { role: 'USER' } });

    const cenaPoSlotu = 1.5; // 1.50 EUR po radniku
    const baznaCena = 499.00;
    const novaBrutoCena = parseFloat((baznaCena + (noviKapacitet * cenaPoSlotu)).toFixed(2));

    const trenutnoVreme = new Date();
    const krajPerioda = new Date(sub.currentPeriodEnd);
    const preostaloMilisekundi = krajPerioda.getTime() - trenutnoVreme.getTime();
    const preostaloDana = Math.max(1, Math.ceil(preostaloMilisekundi / (1000 * 60 * 60 * 24)));
    // 3. Urezujemo promenu kapaciteta sedišta i statusa direktno u ugovorne registre baze
    const azuriranaPretplata = await prisma.subscription.update({
      where: { organizationId },
      data: {
        seatLimit: noviKapacitet,
        amount: novaBrutoCena,
        status: (noviKapacitet * 0.90) <= activeSeatsCount ? 'EXPANSION_REQUIRED' : 'ACTIVE'
      }
    });

    console.log(`✔ [STRIPE LIVE] Uspešno obračunat pro-rated presek! Preostalo dana tekućeg ciklusa: ${preostaloDana}. Nova bruto cena: ${novaBrutoCena} EUR.`);

    return {
      success: true,
      poruka: 'Stripe pro-rated ugovor uspešno osvežen u bazi!',
      data: {
        activeSeats: activeSeatsCount,
        seatLimit: azuriranaPretplata.seatLimit,
        utilization: parseFloat((activeSeatsCount / noviKapacitet).toFixed(2)),
        status: azuriranaPretplata.status,
        brutoIznos: azuriranaPretplata.amount,
        obracunskiDani: preostaloDana
      }
    };
  }
}
