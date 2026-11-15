import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { isAllowedOrigin } from './allowed-origins';

export const verifySocketAccessToken = (token: unknown): { userId: number } => {
  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('WebSocket autentifikacija zahteva token.');
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT konfiguracija nije dostupna.');

  const decoded = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload & { userId?: number; id?: number };
  const userId = decoded.userId ?? decoded.id;
  if (!Number.isInteger(userId) || Number(userId) <= 0) {
    throw new Error('Token nema validan korisnicki identitet.');
  }

  return { userId: Number(userId) };
};

export const authenticateSocketHandshake = (
  socket: { handshake: { auth?: { token?: unknown } }; data: Record<string, unknown> },
  next: (error?: Error) => void
) => {
  try {
    const { userId } = verifySocketAccessToken(socket.handshake.auth?.token);
    socket.data.userId = userId;
    next();
  } catch {
    next(new Error('WebSocket autentifikacija neuspesna. Token nedostaje ili je nevalidan.'));
  }
};

export class WebSocketServer {
  private static io: SocketIOServer | null = null;

  static inicijalizuj(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          if (isAllowedOrigin(origin)) {
            callback(null, true);
            return;
          }
          callback(new Error('Origin not allowed by CORS'));
        },
        methods: ['GET', 'POST'],
        allowedHeaders: ['Authorization', 'Content-Type'],
        credentials: true
      }
    });

    this.io.use(authenticateSocketHandshake);

    this.io.on('connection', (socket: Socket) => {
      socket.join(`user_${socket.data.userId}`);
      console.log('🔌 [SOCKET CONNECT] Autentifikovan klijent povezan.');

      socket.on('disconnect', () => {
        console.log('❌ [SOCKET DISCONNECT] Klijent se odvojio.');
      });
    });
  }

  static emitujB2B(organizationId: number, event: string, payload: any) {
    if (this.io) {
      const roomName = `org_${organizationId}`;
      this.io.to(roomName).emit(event, payload);
      console.log(`📡 [SOCKET BROADCAST] Emitovan dogadjaj [${event}] unutar organizacione sobe.`);
    }
  }
}
