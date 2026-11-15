import { prisma } from '../../../config/db';
import bcrypt from 'bcrypt';

export class SimulatorService {
  static async pokreniMasovnuSimulacijuZaposlenih() {
    console.log('⏳ [NEURO SIMULATOR] Pokrecem skener i ubrizgavanje 100 testnih kohortnih profila...');
    
    const sektori = ['Engineering', 'Marketing', 'Sales', 'All'];
    const kreiraniKorisniciIds: number[] = [];

    // 1. Generisemo testne radnike unutar users registra ako vec ne postoje
    for (let i = 1; i <= 20; i++) {
      const email = `radnik.${i}@enterprise-test.com`;
      let korisnik = await prisma.user.findUnique({ where: { email } });

      if (!korisnik) {
        const hashedPassword = await bcrypt.hash('lozinka123', 10);
        korisnik = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            name: `Zaposleni #${i}`,
            role: 'USER'
          }
        });
      }
      kreiraniKorisniciIds.push(korisnik.id);
    }
    // 2. Ubrizgavamo masovne longitudinalne pulseve stresa za kreirane radnike
    let ubrizganiPulseviGrofo = 0;
    const trenutnoVreme = new Date();

    for (const userId of kreiraniKorisniciIds) {
      // Svaki radnik dobija po 5 razlicitih istorijskih pulseva stresa
      for (let j = 0; j < 5; j++) {
        const randomStres = Math.floor(Math.random() * (85 - 25 + 1)) + 25; // Opseg od 25% do 85% stresa
        const randomSektorId = Math.floor(Math.random() * sektori.length) + 1;
        const istorijskiDatum = new Date(trenutnoVreme);
        istorijskiDatum.setHours(istorijskiDatum.getHours() - (j * 4)); // Vracamo vreme unazad za presek

        await prisma.stressPulse.create({
          data: {
            userId,
            stressLevel: randomStres,
            organizationId: 1,
            timestamp: istorijskiDatum
          }
        });
        ubrizganiPulseviGrofo++;
      }
    }

    return {
      uspesno: true,
      brojRadnika: kreiraniKorisniciIds.length,
      brojPulseva: ubrizganiPulseviGrofo
    };
  }
}
