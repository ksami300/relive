import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import * as BootstrapModule from './config/bootstrap';
import { isAllowedOrigin } from './config/allowed-origins';
import corporateRoutes from './modules/corporate/routes/corporate.routes';
import authRoutes from './modules/auth/routes/auth.routes';
import stressRoutes from './modules/stress/routes/stress.routes';
import interventionRoutes from './interventions/intervention.routes';
import organizationInsightsRoutes from './enterprise/organization-insights.routes';
import integrationRoutes from './integrations/integration.routes';
import { WebSocketServer } from './config/websocket';
import { errorHandler } from './shared/middlewares/error.middleware';
import { rateLimiter } from './shared/middlewares/rate-limit.middleware';

const app = express();
const server = createServer(app);

WebSocketServer.inicijalizuj(server);

app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

app.use(express.json());
app.use('/api/relieve/auth', rateLimiter(10, 60_000));
app.use('/api/relieve/integrations', rateLimiter(60, 60_000));

app.use('/api/relieve/corporate', corporateRoutes);
app.use('/api/relieve/auth', authRoutes);
app.use('/api/relieve/stress', stressRoutes);
app.use('/api/relieve/interventions', interventionRoutes);
app.use('/api/relieve/corporate', organizationInsightsRoutes);
app.use('/api/relieve/integrations', integrationRoutes);
app.use(errorHandler);

async function start() {
  try {
    const kljucevi = Object.keys(BootstrapModule);
    if (kljucevi.length > 0 && typeof (BootstrapModule as any)[kljucevi[0]] === 'function') {
      await (BootstrapModule as any)[kljucevi[0]]();
    }
    
    const port = Number(process.env.PORT ?? 4000);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error('PORT mora biti ceo broj izmedju 1 i 65535.');
    }

    const host = process.env.HOST ?? '127.0.0.1';
    server.listen(port, host, () => {
      console.log(`🔌 [RELIEVE BACKEND LIVE] Autonomni motor sa WebSocket kanalima i Adaptive Baseline-om slusa na portu ${port}`);
    });
  } catch (err) {
    const safeError = err as Error & { code?: unknown };
    console.error('❌ Kritican krah pri lansiranju sistema:', {
      name: safeError.name,
      ...(typeof safeError.code === 'string' ? { code: safeError.code } : {})
    });
    process.exit(1);
  }
}

start();
