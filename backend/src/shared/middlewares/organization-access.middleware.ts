import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/app-error';

export const requireOrganizationMembership = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(
    'Pristup organizacionim podacima je privremeno onemogucen dok sistem ne potvrdi clanstvo korisnika.',
    403,
    'ORGANIZATION_MEMBERSHIP_REQUIRED'
  ));
};
