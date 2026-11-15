import { prisma } from './db';

export const bootstrapDatabase = async () => {
  try {
    console.log('? [SISTEMSKI SKENER] Proveravam status finansijskih registara unutar baze...');
    
    // Proveravamo da li tabela pretplata ima usidrene podatke
    const subCount = await prisma.subscription.count();
    
    if (subCount === 0) {
      console.log('?? Tabela subscriptions je prazna. Pokrecem automatsko B2B seed-ovanje...');
      
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

      await prisma.subscription.create({
        data: {
          organizationId: 1,
          plan: 'ENTERPRISE',
          status: 'ACTIVE',
          amount: 499.00,
          currency: 'EUR',
          seatLimit: 750,
          currentPeriodEnd
        }
      });
      
      console.log('? [BOOTSTRAP SUCCESS] Pretplata za Organizaciju 1 (750 mesta) je uspesno usidrena unutar PostgreSQL stene!');
    } else {
      console.log('? [BOOTSTRAP BYPASS] Finansijski registri su vec naoruzani. Preskacem seed.');
    }
  } catch (err: any) {
    console.error('? [BOOTSTRAP CRITICAL CRASH] Inicijalizacija baze nije uspela.');
    throw err;
  }
};
