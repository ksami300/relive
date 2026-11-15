import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../src/config/db';
import { StressIntelligenceService } from '../src/intelligence/StressIntelligenceService';
import stressRoutes from '../src/modules/stress/routes/stress.routes';
import { errorHandler } from '../src/shared/middlewares/error.middleware';

const originalJwtSecret = process.env.JWT_SECRET;
const testJwtSecret = 'personal-stress-route-test-secret';
process.env.JWT_SECRET = testJwtSecret;

const prismaClient = prisma as any;
const originalCreate = prismaClient.stressPulse.create;
const originalFindMany = prismaClient.stressPulse.findMany;
const ownUserId = 21;
let server: ReturnType<express.Application['listen']>;
let baseUrl: string;
let createMock: (args: any) => Promise<any>;
let findManyMock: (args: any) => Promise<any>;

const tokenFor = (userId: number) =>
  jwt.sign({ userId, id: userId, role: 'USER' }, testJwtSecret);

const request = (path: string, init: RequestInit = {}) =>
  fetch(`${baseUrl}${path}`, init);

before(async () => {
  prismaClient.stressPulse.create = (...args: any[]) => createMock(...args);
  prismaClient.stressPulse.findMany = (...args: any[]) => findManyMock(...args);

  const app = express();
  app.use(express.json());
  app.use('/api/relieve/stress', stressRoutes);
  app.use(errorHandler);

  server = app.listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  prismaClient.stressPulse.create = originalCreate;
  prismaClient.stressPulse.findMany = originalFindMany;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;

  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test('personal stress creation uses only the authenticated identity', async () => {
  let createArgs: any;
  createMock = async (args) => {
    createArgs = args;
    return { id: 101, ...args.data, timestamp: new Date('2026-01-01T00:00:00.000Z') };
  };

  const response = await request('/api/relieve/stress/personal/log', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenFor(ownUserId)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stressLevel: 55, userId: 999, organizationId: 1 })
  });
  const result = await response.json() as any;

  assert.equal(response.status, 201);
  assert.equal(result.success, true);
  assert.equal(result.data.userId, ownUserId);
  assert.equal(result.data.organizationId, null);
  assert.deepEqual(createArgs.data, {
    userId: ownUserId,
    stressLevel: 55,
    organizationId: null
  });
});

test('personal stress routes reject unauthenticated requests', async () => {
  const createResponse = await request('/api/relieve/stress/personal/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stressLevel: 55 })
  });
  const historyResponse = await request('/api/relieve/stress/personal/history');

  assert.equal(createResponse.status, 401);
  assert.equal(historyResponse.status, 401);
});

test('personal stress creation rejects invalid levels before persistence', async () => {
  createMock = async () => {
    throw new Error('Invalid values must not reach persistence');
  };

  for (const stressLevel of [-1, 101, 55.5, '55']) {
    const response = await request('/api/relieve/stress/personal/log', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenFor(ownUserId)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ stressLevel })
    });
    assert.equal(response.status, 400, `stressLevel ${stressLevel} must be rejected`);
  }
});

test('personal history is scoped to the authenticated user and excludes organization records', async () => {
  const ownHistory = [{ id: 102, userId: ownUserId, organizationId: null, stressLevel: 55 }];
  let findManyArgs: any;
  findManyMock = async (args) => {
    findManyArgs = args;
    return ownHistory;
  };

  const response = await request('/api/relieve/stress/personal/history?userId=999', {
    headers: { Authorization: `Bearer ${tokenFor(ownUserId)}` }
  });
  const result = await response.json() as any;

  assert.equal(response.status, 200);
  assert.deepEqual(result.data, ownHistory);
  assert.deepEqual(findManyArgs.where, { userId: ownUserId, organizationId: null });
});

test('personal routes expose no endpoint to read or modify another user record', async () => {
  const response = await request('/api/relieve/stress/personal/history/102', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${tokenFor(999)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stressLevel: 0 })
  });

  assert.equal(response.status, 404);
});

test('organization stress logging still requires verified membership', async () => {
  const organizationClaimToken = jwt.sign(
    { userId: ownUserId, id: ownUserId, role: 'USER', organizationId: 1 },
    testJwtSecret
  );
  const response = await request('/api/relieve/stress/log', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${organizationClaimToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stressLevel: 55 })
  });
  const result = await response.json() as any;

  assert.equal(response.status, 403);
  assert.equal(result.code, 'ORGANIZATION_MEMBERSHIP_REQUIRED');
});

test('personal history database errors return an unsuccessful API response', async () => {
  findManyMock = async () => {
    throw new Error('Mock database failure');
  };

  const response = await request('/api/relieve/stress/personal/history', {
    headers: { Authorization: `Bearer ${tokenFor(ownUserId)}` }
  });
  const result = await response.json() as any;

  assert.equal(response.status, 500);
  assert.equal(result.success, false);
});

test('personal stress creation database errors return an unsuccessful API response', async () => {
  createMock = async () => {
    throw new Error('Mock database failure');
  };

  const response = await request('/api/relieve/stress/personal/log', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokenFor(ownUserId)}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stressLevel: 55 })
  });
  const result = await response.json() as any;

  assert.equal(response.status, 500);
  assert.equal(result.success, false);
});

test('organization stress intelligence excludes personal records', async () => {
  const originalAggregate = prismaClient.stressPulse.aggregate;
  const originalOutcomeFindMany = prismaClient.interventionOutcome.findMany;
  let aggregateArgs: any;
  prismaClient.stressPulse.aggregate = async (args: any) => {
    aggregateArgs = args;
    return { _avg: { stressLevel: 60 } };
  };
  prismaClient.interventionOutcome.findMany = async () => [];

  try {
    await StressIntelligenceService.izracunajAdaptivniPrag(ownUserId);
    assert.deepEqual(aggregateArgs.where, {
      userId: ownUserId,
      organizationId: { not: null }
    });
  } finally {
    prismaClient.stressPulse.aggregate = originalAggregate;
    prismaClient.interventionOutcome.findMany = originalOutcomeFindMany;
  }
});
