import { WearableProvider } from '../WearableProvider';
import { NormalizedHealthEvent } from '../../schemas/health-event.schema';

export class FitbitProvider extends WearableProvider {
  async preuzmiSiroveDogadjaje(userId: number): Promise<any[]> {
    // Simuliramo dolazni REST niz sa eksternog Fitbit API-ja pod mreznim naponom
    return [{
      trackerId: "FB-9921X",
      timestamp: new Date().toISOString(),
      heartRate: 88,
      restingHeartRate: 64,
      hrv: 42,
      sleepMinutes: 410,
      steps: 3200
    }];
  }

  normalizuj(userId: number, siroviPodaci: any[]): NormalizedHealthEvent[] {
    return siroviPodaci.map(item => ({
      userId,
      source: "FITBIT",
      timestamp: new Date(item.timestamp),
      heartRate: item.heartRate,
      restingHeartRate: item.restingHeartRate,
      hrv: item.hrv,
      sleepMinutes: item.sleepMinutes,
      steps: item.steps
    }));
  }
}
