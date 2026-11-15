import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string({ error: 'E-mail je obavezan.' }).email('Uneti tekst mora biti validna e-mail adresa.'),
    password: z.string({ error: 'Lozinka je obavezna.' }).min(8, 'Lozinka mora imati najmanje 8 karaktera.'),
    name: z.string({ error: 'Ime je obavezno.' }).min(2, 'Ime mora imati najmanje 2 karaktera.')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string({ error: 'E-mail je obavezan.' }).email('Uneti tekst mora biti validna e-mail adresa.'),
    password: z.string({ error: 'Lozinka je obavezna.' })
  })
});

export const refreshSchema = z.object({
  body: z.object({
    token: z.string({ error: 'Refresh token je obavezan stav unosa.' })
  })
});
