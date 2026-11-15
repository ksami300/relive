import { Router } from 'express';
import { IntegrationController } from './integration.controller';
import { protect } from '../shared/middlewares/auth.middleware';
import { biometricRateLimiterShield } from '../shared/middlewares/biometric-limiter.middleware';
import { consentVerificationShield } from '../shared/middlewares/consent-shield.middleware';
import { validate } from '../shared/middlewares/validation.middleware';
import {
  consentStatusValidation,
  consentUpdateValidation,
  healthEventBatchValidation,
  healthEventValidation
} from './integration.validation';

const router = Router();

// Pojedinačni mrežni događaj nosivih uređaja
router.post('/events', protect as any, validate(healthEventValidation), consentVerificationShield as any, biometricRateLimiterShield as any, IntegrationController.unesiBiometrijskiDogadjaj as any);

// 🚨 BATCH RUTA SADA IMA DVOSTRUKU ZAŠTITU: Prvo Consent provera, pa Rate-Limiter protiv poplava!
router.post('/batch', protect as any, validate(healthEventBatchValidation), consentVerificationShield as any, biometricRateLimiterShield as any, IntegrationController.unesiMasovniNizBiometrije as any);

// Statusi privatnosti i digitalnih pristanaka zaposlenih
router.get('/status', protect as any, validate(consentStatusValidation), IntegrationController.preuzmiStatusPristankaKlijent as any);
router.post('/consent', protect as any, validate(consentUpdateValidation), IntegrationController.azurirajStatusPristankaKlijent as any);

export default router;
