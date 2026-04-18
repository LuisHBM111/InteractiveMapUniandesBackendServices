import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FirebaseAdminService } from './firebase-admin.service';
import { AuthenticatedRequest } from './interfaces/authenticated-user-context.interface';
import { UsersService } from '../users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseAdminService: FirebaseAdminService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authorization header with a Firebase Bearer token is required.',
      );
    }

    const token = authorizationHeader.slice('Bearer '.length).trim();
    const firebaseUser = await this.firebaseAdminService.verifyIdToken(token);
    const user = await this.usersService.getOrCreateFromFirebaseIdentity({
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.name,
      picture: firebaseUser.picture,
      provider: firebaseUser.firebase?.sign_in_provider,
    });

    request.authenticatedUser = {
      firebaseUser,
      user,
    };

    return true;
  }
}
