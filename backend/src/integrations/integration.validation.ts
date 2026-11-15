import { z } from 'zod';
import {
  HealthEventBatchSchema,
  HealthEventSchema,
  HealthProviderSchema
} from './schemas/health-event.schema';

export const healthEventBatchValidation = z.object({
  body: HealthEventBatchSchema
});

export const healthEventValidation = z.object({
  body: HealthEventSchema
});

export const consentStatusValidation = z.object({
  query: z.object({ provider: HealthProviderSchema.optional() })
});

export const consentUpdateValidation = z.object({
  body: z.object({
    provider: HealthProviderSchema.optional(),
    granted: z.boolean()
  }).strict()
});
