import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';
import { User } from '../../users/entities/user.entity';

export interface AuthenticatedUserContext {
  firebaseUser: DecodedIdToken;
  user: User;
}

export interface AuthenticatedRequest extends Request {
  authenticatedUser?: AuthenticatedUserContext;
}
