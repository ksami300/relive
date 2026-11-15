import { prisma } from '../config/db';
import { AppError } from '../shared/utils/app-error';

export class InterventionOutcomeService {
  static async evidentirajUspesnostIshoda(interventionId: number, userId: number, stressAfter: number, completed: boolean, feedback: string) {
    const intervention = await prisma.stressIntervention.findFirst({
      where: { id: interventionId, userId }
    });
    if (!intervention) {
      throw new AppError('Intervencija nije pronadjena za ovog korisnika.', 404, 'NOT_FOUND');
    }

    const azuriranaIntervencija = await prisma.stressIntervention.update({
      where: { id: intervention.id },
      data: {
        status: completed ? 'COMPLETED' : 'FAILED',
        recommendation: `Zavrseno uz feedback: ${feedback}`
      }
    });

    // 🔒 UGASIVANJE KONTROLERA: Vraćamo i data i podaci polja da ugasimo promašaje u ruteru
    return { 
      success: true,
      data: azuriranaIntervencija,
      podaci: azuriranaIntervencija
    };
  }
}
