import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/routes/auth.routes';
import stressRoutes from './modules/stress/routes/stress.routes';
import corporateRoutes from './modules/corporate/routes/corporate.routes';
import { errorHandler } from './shared/middlewares/error.middleware';
import { rateLimiter } from './shared/middlewares/rate-limit.middleware'; // ?? IN�ENJERSKI UVOZ
import { AppError } from './shared/utils/app-error';
import { isAllowedOrigin } from './config/allowed-origins';

dotenv.config();

const app: Application = express();

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ?? ZAVARIVANJE AMORTIZERA NA STRATE�KE VODOVE SAAS EKOSISTEMA
// Maksimalno 10 login/register poku�aja u minuti po IP adresi
app.use('/api/auth', rateLimiter(10, 60000), authRoutes);

// Maksimalno 100 stres pulsacija i analitickih upita u minuti
app.use('/api/relieve', rateLimiter(100, 60000), stressRoutes);

// Maksimalno 100 menad�erskih B2B upita u minuti
app.use('/api/corporate', rateLimiter(100, 60000), corporateRoutes);

app.use('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Ruta ${req.originalUrl} ne postoji na ovom serveru.`, 404, 'NOT_FOUND'));
});

app.use(errorHandler);

export default app;
