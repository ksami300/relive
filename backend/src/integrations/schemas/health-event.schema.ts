import { z } from 'zod';

export const HealthProviderSchema = z.enum(["APPLE_HEALTH", "HEALTH_CONNECT", "FITBIT"]);

export const HealthEventSchema = z.object({
  source: HealthProviderSchema,
  timestamp: z.string().datetime(),
  heartRate: z.number().min(1).max(250).optional(),
  restingHeartRate: z.number().min(1).max(250).optional(),
  hrv: z.number().min(1).max(200).optional(),
  sleepMinutes: z.number().int().min(0).max(1440).optional(),
  steps: z.number().int().min(0).max(200000).optional()
}).strict();

export const HealthEventBatchSchema = z.object({
  events: z.array(HealthEventSchema).min(1).max(100)
}).strict();

export interface NormalizedHealthEvent {
  userId: number;
  source: "APPLE_HEALTH" | "HEALTH_CONNECT" | "FITBIT";
  timestamp: Date;
  heartRate?: number;
  restingHeartRate?: number;
  hrv?: number;
  sleepMinutes?: number;
  steps?: number;
}

export type HealthProvider = z.infer<typeof HealthProviderSchema>;
export type HealthEventInput = z.infer<typeof HealthEventSchema>;
