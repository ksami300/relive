import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { prisma } from '../../../config/db';
import { AppError } from '../../../shared/utils/app-error';
import { RegisterDto, LoginDto } from '../auth.interfaces';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('relieve-authentication-dummy-password', 10);

export const hashRefreshToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

export const buildAuthTokenPayload = (user: { id: number; role: string }) => ({
  id: user.id,
  userId: user.id,
  role: user.role,
});

export class AuthService {
  private static get jwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new AppError('JWT konfiguracija nije dostupna.', 500, 'CONFIGURATION_ERROR');
    return secret;
  }

  private static get jwtRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new AppError('JWT refresh konfiguracija nije dostupna.', 500, 'CONFIGURATION_ERROR');
    return secret;
  }

  static async register(dto: RegisterDto) {
    const { email, password, name } = dto;

    const uocenKorisnik = await prisma.user.findUnique({ where: { email } });
    if (uocenKorisnik) {
      throw new AppError('E-mail adresa je vec zauzeta u sistemu.', 400, 'EMAIL_TAKEN');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const noviKorisnik = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER'
      }
    });

    return { id: noviKorisnik.id, email: noviKorisnik.email, name: noviKorisnik.name };
  }

  static async login(dto: LoginDto) {
    const { email, password } = dto;

    const korisnik = await prisma.user.findUnique({ where: { email } });
    const isPasswordValid = await bcrypt.compare(password, korisnik?.password ?? DUMMY_PASSWORD_HASH);
    if (!isPasswordValid) {
      throw new AppError('Unete informacije nisu ispravne.', 401, 'INVALID_CREDENTIALS');
    }
    if (!korisnik) throw new AppError('Unete informacije nisu ispravne.', 401, 'INVALID_CREDENTIALS');

    const tokenPayload = buildAuthTokenPayload({ id: korisnik.id, role: korisnik.role });

    const token = jwt.sign(tokenPayload, this.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign(
      { userId: korisnik.id, jti: randomUUID() },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        token: hashRefreshToken(refreshToken),
        userId: korisnik.id,
        expiresAt
      }
    });

    return {
      token,
      refreshToken,
      user: { id: korisnik.id, name: korisnik.name, email: korisnik.email }
    };
  }

  static async refresh(token: string) {
    let deklasiran: { userId: number };
    try {
      const payload = jwt.verify(token, this.jwtRefreshSecret, { algorithms: ['HS256'] }) as jwt.JwtPayload & { userId?: number };
      if (!Number.isInteger(payload.userId) || Number(payload.userId) <= 0) {
        throw new AppError('Refresh token nema validan korisnicki identitet.', 401, 'INVALID_REFRESH');
      }
      deklasiran = { userId: Number(payload.userId) };
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (err instanceof jwt.TokenExpiredError) {
        throw new AppError('Refresh token je istekao.', 401, 'REFRESH_EXPIRED');
      }
      throw new AppError('Bezbednosna verifikacija refresh tokena neuspesna.', 401, 'INVALID_REFRESH');
    }

    const hashedToken = hashRefreshToken(token);
    const osvezavajuciZapis =
      await prisma.refreshToken.findUnique({ where: { token: hashedToken } }) ??
      await prisma.refreshToken.findUnique({ where: { token } });

    if (!osvezavajuciZapis) {
      await prisma.refreshToken.deleteMany({ where: { userId: deklasiran.userId } });
      throw new AppError('Refresh token je opozvan ili ponovo upotrebljen.', 401, 'REFRESH_REUSED');
    }

    if (osvezavajuciZapis.userId !== deklasiran.userId) {
      throw new AppError('Refresh token ne pripada ovom korisniku.', 401, 'INVALID_REFRESH');
    }

    const now = new Date();
    if (osvezavajuciZapis.expiresAt <= now) {
      await prisma.refreshToken.deleteMany({ where: { id: osvezavajuciZapis.id } });
      throw new AppError('Refresh token je istekao.', 401, 'REFRESH_EXPIRED');
    }

    const korisnik = await prisma.user.findUnique({ where: { id: deklasiran.userId } });
    if (!korisnik) throw new AppError('Korisnik vise ne postoji.', 404, 'USER_NOT_FOUND');

    const noviToken = jwt.sign(
      buildAuthTokenPayload({ id: korisnik.id, role: korisnik.role }),
      this.jwtSecret,
      { expiresIn: '15m' }
    );
    const noviRefreshToken = jwt.sign(
      { userId: korisnik.id, jti: randomUUID() },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    );
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const rotated = await prisma.$transaction(async (transaction) => {
      const consumed = await transaction.refreshToken.deleteMany({
        where: {
          id: osvezavajuciZapis.id,
          token: osvezavajuciZapis.token,
          userId: korisnik.id,
          expiresAt: { gt: now }
        }
      });
      if (consumed.count !== 1) return false;

      await transaction.refreshToken.create({
        data: { token: hashRefreshToken(noviRefreshToken), userId: korisnik.id, expiresAt }
      });
      return true;
    });

    if (!rotated) {
      await prisma.refreshToken.deleteMany({ where: { userId: korisnik.id } });
      throw new AppError('Refresh token je ponovo upotrebljen; sve sesije su opozvane.', 401, 'REFRESH_REUSED');
    }

    return { token: noviToken, refreshToken: noviRefreshToken };
  }

  static async logout(token: string) {
    let payload: jwt.JwtPayload & { userId?: number };
    try {
      payload = jwt.verify(token, this.jwtRefreshSecret, {
        algorithms: ['HS256'],
        ignoreExpiration: true
      }) as jwt.JwtPayload & { userId?: number };
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Refresh token nije validan.', 401, 'INVALID_REFRESH');
    }

    if (!Number.isInteger(payload.userId) || Number(payload.userId) <= 0) {
      throw new AppError('Refresh token nema validan korisnicki identitet.', 401, 'INVALID_REFRESH');
    }

    const tokenHash = hashRefreshToken(token);
    await prisma.refreshToken.deleteMany({
      where: {
        userId: Number(payload.userId),
        OR: [{ token: tokenHash }, { token }]
      }
    });
  }
}
