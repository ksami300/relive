import { z } from 'zod';

export const pokreniKampanjuSchema = z.object({
  body: z.object({
    type: z.enum(['STRESS_AUDIO_CDN', 'NUTRI_FLOW_ALIGNMENT', 'HYDRO_ALERT'] as const, {
      error: 'Tip wellness kampanje je obavezan i mora biti validan.',
    }),
    cohort: z.enum(['Engineering', 'Marketing', 'Sales', 'All'] as const, {
      error: 'Ciljna kohorta zaposlenih je obavezna stavka.',
    }),
  }),
});

export const azurirajMestaSchema = z.object({
  body: z.object({
    seatQuantity: z
      .number({ error: 'Broj sedista je obavezan.' })
      .min(10, 'Minimalan kapacitet za B2B je 10 licenciranih mesta.'),
  }),
});
