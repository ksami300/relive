import { z } from 'zod';

export const stresPulsSchema = z.object({
  body: z.object({
    stressLevel: z
      .number({ error: 'Nivo stresa je obavezan stav unosa.' })
      .int('Nivo stresa mora biti ceo broj.')
      .min(0, 'Nivo stresa ne moze biti manji od 0.')
      .max(100, 'Nivo stresa ne moze biti veci od 100.')
  })
});
