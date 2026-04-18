import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class SetupGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const expectedKey = process.env.SETUP_API_KEY?.trim();
    const setupEndpointsEnabled = process.env.ENABLE_SETUP_ENDPOINTS === 'true';

    if (expectedKey) {
      const providedHeader = request.headers['x-setup-key'];
      const providedKey = Array.isArray(providedHeader)
        ? providedHeader[0]
        : providedHeader;

      if (!providedKey?.trim()) {
        throw new UnauthorizedException(
          'Provide the setup key in the x-setup-key header.',
        );
      }

      if (providedKey.trim() !== expectedKey) {
        throw new UnauthorizedException('Invalid setup key.');
      }

      return true;
    }

    if (setupEndpointsEnabled) {
      return true;
    }

    throw new ForbiddenException(
      'Setup endpoints are disabled. Set ENABLE_SETUP_ENDPOINTS=true locally or configure SETUP_API_KEY.',
    );
  }
}
