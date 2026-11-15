import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import { prisma } from '../src/config/db';
import { authenticateSocketHandshake, verifySocketAccessToken } from '../src/config/websocket';
import { isAllowedOrigin } from '../src/config/allowed-origins';
import { errorHandler } from '../src/shared/middlewares/error.middleware';
import { AuthService, buildAuthTokenPayload, hashRefreshToken } from '../src/modules/auth/services/auth.service';
import corporateRoutes from '../src/modules/corporate/routes/corporate.routes';
import organizationInsightsRoutes from '../src/enterprise/organization-insights.routes';
import stressRoutes from '../src/modules/stress/routes/stress.routes';
import integrationRoutes from '../src/integrations/integration.routes';
import { StressService } from '../src/modules/stress/services/stress.service';
import { WearableSyncService } from '../src/integrations/wearable/WearableSyncService';
import { InterventionOutcomeService } from '../src/interventions/InterventionOutcomeService';
import interventionRoutes from '../src/interventions/intervention.routes';

const originalJwtSecret = process.env.JWT_SECRET;
const originalRefreshSecret = process.env.JWT_REFRESH_SECRET;

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

const user = {
  id: 11,
  role: 'USER',
  email: 'user@example.com',
  name: 'User',
  password: '$2b$10$test',
};

let tokenSequence = 0;
const tokenFor = (userId = user.id) =>
  jwt.sign({ userId, jti: String(++tokenSequence) }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

const mockRefreshTokenStore = (initialRows: Array<{ id: number; token: string; userId: number; expiresAt: Date }> = []) => {
  const prismaClient = prisma as any;
  const rows = initialRows.map((row) => ({ ...row }));
  let nextId = Math.max(0, ...rows.map((row) => row.id)) + 1;

  const originals = {
    findUnique: prismaClient.refreshToken.findUnique,
    create: prismaClient.refreshToken.create,
    deleteMany: prismaClient.refreshToken.deleteMany,
    transaction: prismaClient.$transaction,
    userFindUnique: prismaClient.user.findUnique,
  };

  prismaClient.user.findUnique = async ({ where }: any) => where.id === user.id ? user : null;
  prismaClient.refreshToken.findUnique = async ({ where }: any) =>
    rows.find((row) => row.token === where.token) ?? null;
  prismaClient.refreshToken.create = async ({ data }: any) => {
    const row = { id: nextId++, ...data };
    rows.push(row);
    return row;
  };
  prismaClient.refreshToken.deleteMany = async ({ where }: any) => {
    const matches = (row: any) => {
      if (where.id !== undefined && row.id !== where.id) return false;
      if (where.userId !== undefined && row.userId !== where.userId) return false;
      if (where.token !== undefined && row.token !== where.token) return false;
      if (where.expiresAt?.gt && row.expiresAt <= where.expiresAt.gt) return false;
      if (where.OR && !where.OR.some((condition: any) => row.token === condition.token)) return false;
      return true;
    };
    const before = rows.length;
    for (let index = rows.length - 1; index >= 0; index--) {
      if (matches(rows[index])) rows.splice(index, 1);
    }
    return { count: before - rows.length };
  };
  prismaClient.$transaction = async (callback: (transaction: any) => unknown) => callback(prisma);

  return {
    rows,
    restore: () => {
      prismaClient.refreshToken.findUnique = originals.findUnique;
      prismaClient.refreshToken.create = originals.create;
      prismaClient.refreshToken.deleteMany = originals.deleteMany;
      prismaClient.$transaction = originals.transaction;
      prismaClient.user.findUnique = originals.userFindUnique;
    },
  };
};

test('auth access-token payload contains identity but no organization assignment', () => {
  const payload = buildAuthTokenPayload({ id: 42, role: 'USER' });

  assert.equal(payload.id, 42);
  assert.equal(payload.userId, 42);
  assert.equal(payload.role, 'USER');
  assert.equal('organizationId' in payload, false);
});

test('authentication rejects bad passwords without revealing whether the account exists', async () => {
  const prismaClient = prisma as any;
  const findUnique = prismaClient.user.findUnique;
  prismaClient.user.findUnique = async ({ where }: any) => {
    if (where.email === user.email) return { ...user, password: await bcrypt.hash('different-password', 10) };
    return null;
  };

  try {
    const errors = await Promise.all([
      AuthService.login({ email: user.email, password: 'wrong-password' }).catch((error) => error),
      AuthService.login({ email: 'missing@example.com', password: 'wrong-password' }).catch((error) => error),
    ]);
    assert.equal(errors[0].statusCode, 401);
    assert.equal(errors[0].code, 'INVALID_CREDENTIALS');
    assert.equal(errors[0].message, errors[1].message);
    assert.equal(errors[1].code, 'INVALID_CREDENTIALS');
  } finally {
    prismaClient.user.findUnique = findUnique;
  }
});

test('stress records are not silently assigned to the default organization', async () => {
  await assert.rejects(
    StressService.zabeleziPuls(user.id, 55),
    (error: any) => error.code === 'ORGANIZATION_MEMBERSHIP_REQUIRED' && error.statusCode === 403
  );
});

test('Socket.IO token validation accepts a valid access token and rejects an invalid token', () => {
  const token = jwt.sign({ id: 7, organizationId: 999 }, process.env.JWT_SECRET!);
  assert.deepEqual(verifySocketAccessToken(token), { userId: 7 });
  assert.throws(() => verifySocketAccessToken('invalid-token'));
  assert.throws(() => verifySocketAccessToken(undefined));

  const validSocket = { handshake: { auth: { token } }, data: {} as Record<string, unknown> };
  let validError: Error | undefined;
  authenticateSocketHandshake(validSocket, (error) => { validError = error; });
  assert.equal(validError, undefined);
  assert.equal(validSocket.data.userId, 7);

  const invalidSocket = { handshake: { auth: { token: 'invalid-token' } }, data: {} as Record<string, unknown> };
  let invalidError: Error | undefined;
  authenticateSocketHandshake(invalidSocket, (error) => { invalidError = error; });
  assert.ok(invalidError instanceof Error);
});

test('CORS uses configured allowed origins and does not allow arbitrary origins', () => {
  const originalAllowedOrigins = process.env.ALLOWED_ORIGINS;
  process.env.ALLOWED_ORIGINS = 'https://app.example.test, https://admin.example.test ';

  try {
    assert.equal(isAllowedOrigin('https://app.example.test'), true);
    assert.equal(isAllowedOrigin('https://admin.example.test'), true);
    assert.equal(isAllowedOrigin('https://attacker.example.test'), false);
    assert.equal(isAllowedOrigin(undefined), true);
  } finally {
    if (originalAllowedOrigins === undefined) delete process.env.ALLOWED_ORIGINS;
    else process.env.ALLOWED_ORIGINS = originalAllowedOrigins;
  }
});

test('organization and org-scoped stress routes deny regular users even with a forged legacy org claim', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/relieve/corporate', corporateRoutes);
  app.use('/api/relieve/corporate', organizationInsightsRoutes);
  app.use('/api/relieve/stress', stressRoutes);
  app.use(errorHandler);

  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const accessToken = jwt.sign(
      { userId: user.id, id: user.id, role: 'USER', organizationId: 999 },
      process.env.JWT_SECRET!
    );
    const headers = { Authorization: `Bearer ${accessToken}` };
    const unauthenticatedResponse = await fetch(
      `http://127.0.0.1:${address.port}/api/relieve/stress/log`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stressLevel: 50 })
      }
    );
    assert.equal(unauthenticatedResponse.status, 401);

    for (const stressLevel of [-1, 101, 50.5, '50']) {
      const invalidValueResponse = await fetch(
        `http://127.0.0.1:${address.port}/api/relieve/stress/log`,
        {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ stressLevel })
        }
      );
      assert.equal(invalidValueResponse.status, 400, `stressLevel ${stressLevel} must be rejected`);
    }

    const paths = [
      '/api/relieve/corporate/999/scorecard',
      '/api/relieve/corporate/999/predictions',
      '/api/relieve/stress/log',
    ];

    for (const path of paths) {
      const isStressRoute = path.endsWith('/log');
      const requestOptions: RequestInit = {
        method: isStressRoute ? 'POST' : 'GET',
        headers: isStressRoute ? { ...headers, 'Content-Type': 'application/json' } : headers,
      };
      if (isStressRoute) requestOptions.body = JSON.stringify({ stressLevel: 55 });

      const response = await fetch(`http://127.0.0.1:${address.port}${path}`, requestOptions);
      assert.equal(response.status, 403, `${path} must deny access without verified organization membership`);
      assert.equal((await response.json() as any).code, 'ORGANIZATION_MEMBERSHIP_REQUIRED');
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('wearable ingestion requires explicit consent and missing consent is reported as denied', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/relieve/integrations', integrationRoutes);
  app.use(errorHandler);

  const prismaClient = prisma as any;
  const findConsent = prismaClient.healthDataConsent.findUnique;
  const upsertConsent = prismaClient.healthDataConsent.upsert;
  const upsertIntegration = prismaClient.healthIntegration.upsert;
  const grantedProviders = new Set<string>();
  prismaClient.healthDataConsent.findUnique = async ({ where }: any) =>
    grantedProviders.has(where.userId_provider.provider) ? { granted: true } : null;
  prismaClient.healthDataConsent.upsert = async ({ where, create, update }: any) => {
    const granted = update.granted ?? create.granted;
    if (granted) grantedProviders.add(where.userId_provider.provider);
    else grantedProviders.delete(where.userId_provider.provider);
    return { ...create, ...update };
  };
  prismaClient.healthIntegration.upsert = async ({ create, update }: any) => ({ id: 1, ...create, ...update });
  const server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const accessToken = jwt.sign({ userId: user.id, role: 'USER' }, process.env.JWT_SECRET!);
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };
    const statusResponse = await fetch(`http://127.0.0.1:${address.port}/api/relieve/integrations/status`, { headers });
    const status = await statusResponse.json() as any;
    assert.equal(status.data.granted, false);

    const ingestionResponse = await fetch(`http://127.0.0.1:${address.port}/api/relieve/integrations/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ source: 'FITBIT', timestamp: new Date().toISOString() }),
    });
    assert.equal(ingestionResponse.status, 403);

    grantedProviders.add('FITBIT');
    const appleEventResponse = await fetch(`http://127.0.0.1:${address.port}/api/relieve/integrations/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ source: 'APPLE_HEALTH', timestamp: new Date().toISOString() }),
    });
    assert.equal(appleEventResponse.status, 403, 'Fitbit consent must not authorize Apple Health data');

    const oversizedBatchResponse = await fetch(`http://127.0.0.1:${address.port}/api/relieve/integrations/batch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        events: Array.from({ length: 101 }, () => ({ source: 'FITBIT', timestamp: new Date().toISOString() }))
      }),
    });
    assert.equal(oversizedBatchResponse.status, 400, 'batch ingestion must reject more than 100 records');

    const consentResponse = await fetch(`http://127.0.0.1:${address.port}/api/relieve/integrations/consent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ provider: 'APPLE_HEALTH', granted: true }),
    });
    assert.equal(consentResponse.status, 200);
    assert.equal(grantedProviders.has('APPLE_HEALTH'), true);
  } finally {
    prismaClient.healthDataConsent.findUnique = findConsent;
    prismaClient.healthDataConsent.upsert = upsertConsent;
    prismaClient.healthIntegration.upsert = upsertIntegration;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test('batch ingestion maps every source to its own integration and rechecks consent', async () => {
  const prismaClient = prisma as any;
  const originalMethods = {
    findConsent: prismaClient.healthDataConsent.findUnique,
    upsertIntegration: prismaClient.healthIntegration.upsert,
    findEvent: prismaClient.physiologicalEvent.findFirst,
    createEvent: prismaClient.physiologicalEvent.create,
  };
  const grantedProviders = new Set(['FITBIT', 'APPLE_HEALTH']);
  const storedEvents: any[] = [];
  prismaClient.healthDataConsent.findUnique = async ({ where }: any) =>
    grantedProviders.has(where.userId_provider.provider) ? { granted: true } : null;
  prismaClient.healthIntegration.upsert = async ({ create }: any) =>
    ({ id: create.provider === 'FITBIT' ? 12 : 13 });
  prismaClient.physiologicalEvent.findFirst = async () => null;
  prismaClient.physiologicalEvent.create = async ({ data }: any) => {
    storedEvents.push(data);
    return data;
  };

  try {
    const inserted = await WearableSyncService.ugutajMasovniNizDogadjaja(user.id, [
      { source: 'FITBIT', timestamp: new Date().toISOString(), hrv: 44 },
      { source: 'APPLE_HEALTH', timestamp: new Date().toISOString(), hrv: 45 },
    ]);
    assert.equal(inserted, 2);
    assert.deepEqual(storedEvents.map((event) => event.integrationId), [12, 13]);

    grantedProviders.delete('APPLE_HEALTH');
    await assert.rejects(
      WearableSyncService.ugutajMasovniNizDogadjaja(user.id, [
        { source: 'APPLE_HEALTH', timestamp: new Date().toISOString() },
      ]),
      (error: any) => error.code === 'CONSENT_REQUIRED' && error.statusCode === 403
    );
    assert.equal(storedEvents.length, 2);
  } finally {
    prismaClient.healthDataConsent.findUnique = originalMethods.findConsent;
    prismaClient.healthIntegration.upsert = originalMethods.upsertIntegration;
    prismaClient.physiologicalEvent.findFirst = originalMethods.findEvent;
    prismaClient.physiologicalEvent.create = originalMethods.createEvent;
  }
});

test('outcome updates cannot target another user intervention', async () => {
  const prismaClient = prisma as any;
  const findFirst = prismaClient.stressIntervention.findFirst;
  const update = prismaClient.stressIntervention.update;
  let query: unknown;
  let updateCalled = false;
  prismaClient.stressIntervention.findFirst = async (args: any) => {
    query = args;
    return null;
  };
  prismaClient.stressIntervention.update = async () => {
    updateCalled = true;
  };

  try {
    await assert.rejects(
      InterventionOutcomeService.evidentirajUspesnostIshoda(88, user.id, 40, true, 'HELPED'),
      (error: any) => error.code === 'NOT_FOUND' && error.statusCode === 404
    );
    assert.deepEqual(query, { where: { id: 88, userId: user.id } });
    assert.equal(updateCalled, false);
  } finally {
    prismaClient.stressIntervention.findFirst = findFirst;
    prismaClient.stressIntervention.update = update;
  }
});

test('AuthService.login stores only a hash of the refresh token', async () => {
  const prismaClient = prisma as any;
  const findUnique = prismaClient.user.findUnique;
  const createRefresh = prismaClient.refreshToken.create;

  prismaClient.user.findUnique = async ({ where }: any) => where.email === user.email ? {
    ...user,
    password: await bcrypt.hash('Password123', 10),
  } : null;
  let storedToken = '';
  prismaClient.refreshToken.create = async ({ data }: any) => {
    storedToken = data.token;
    return data;
  };

  try {
    const result = await AuthService.login({ email: user.email, password: 'Password123' });
    const decoded = jwt.verify(result.token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    assert.equal(decoded.userId, user.id);
    assert.equal('organizationId' in decoded, false);
    assert.equal('organizationId' in result.user, false);
    assert.equal(storedToken, hashRefreshToken(result.refreshToken));
    assert.notEqual(storedToken, result.refreshToken);
  } finally {
    prismaClient.user.findUnique = findUnique;
    prismaClient.refreshToken.create = createRefresh;
  }
});

test('refresh rotates the token and a concurrent reuse revokes the active session', async () => {
  const token = tokenFor();
  const store = mockRefreshTokenStore([{
    id: 1,
    token: hashRefreshToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60_000),
  }]);

  try {
    const result = await AuthService.refresh(token);
    const accessPayload = jwt.verify(result.token, process.env.JWT_SECRET!) as jwt.JwtPayload & { userId: number };
    assert.equal(accessPayload.userId, user.id);
    assert.equal(store.rows.length, 1);
    assert.equal(store.rows[0].token, hashRefreshToken(result.refreshToken));
    assert.notEqual(result.refreshToken, token);

    await assert.rejects(
      AuthService.refresh(token),
      (error: any) => error.code === 'REFRESH_REUSED' && error.statusCode === 401
    );
    assert.equal(store.rows.length, 0);
  } finally {
    store.restore();
  }
});

test('expired refresh tokens are rejected', async () => {
  const store = mockRefreshTokenStore();
  try {
    const expiredToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: -1 });
    await assert.rejects(
      AuthService.refresh(expiredToken),
      (error: any) => error.code === 'REFRESH_EXPIRED' && error.statusCode === 401
    );
  } finally {
    store.restore();
  }
});

test('revoked refresh tokens cannot be reused and revoke remaining active sessions', async () => {
  const token = tokenFor();
  const anotherToken = tokenFor(user.id);
  const store = mockRefreshTokenStore([{
    id: 1,
    token: hashRefreshToken(anotherToken),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60_000),
  }]);

  try {
    await assert.rejects(
      AuthService.refresh(token),
      (error: any) => error.code === 'REFRESH_REUSED' && error.statusCode === 401
    );
    assert.equal(store.rows.length, 0);
  } finally {
    store.restore();
  }
});

test('parallel refresh requests cannot both rotate the same token', async () => {
  const token = tokenFor();
  const store = mockRefreshTokenStore([{
    id: 1,
    token: hashRefreshToken(token),
    userId: user.id,
    expiresAt: new Date(Date.now() + 60_000),
  }]);

  try {
    const results = await Promise.allSettled([
      AuthService.refresh(token),
      AuthService.refresh(token),
    ]);
    assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
    assert.equal(results.filter((result) => result.status === 'rejected').length, 1);
    assert.equal(store.rows.length, 0);
  } finally {
    store.restore();
  }
});

test('logout revokes the refresh token and remains valid for expired sessions', async () => {
  const expiredToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: -1 });
  const store = mockRefreshTokenStore([{
    id: 1,
    token: hashRefreshToken(expiredToken),
    userId: user.id,
    expiresAt: new Date(Date.now() - 1_000),
  }]);

  try {
    await AuthService.logout(expiredToken);
    assert.equal(store.rows.length, 0);
  } finally {
    store.restore();
  }
});

process.on('exit', () => {
  if (originalJwtSecret) process.env.JWT_SECRET = originalJwtSecret; else delete process.env.JWT_SECRET;
  if (originalRefreshSecret) process.env.JWT_REFRESH_SECRET = originalRefreshSecret; else delete process.env.JWT_REFRESH_SECRET;
});
