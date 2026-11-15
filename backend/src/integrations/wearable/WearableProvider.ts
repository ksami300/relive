import { NormalizedHealthEvent } from '../schemas/health-event.schema';

export abstract class WearableProvider {
  abstract preuzmiSiroveDogadjaje(userId: number): Promise<any[]>;
  abstract normalizuj(userId: number, siroviPodaci: any[]): NormalizedHealthEvent[];
}
