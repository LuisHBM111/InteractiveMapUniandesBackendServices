import {
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

interface FirebaseServiceAccount {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

@Injectable()
export class FirebaseAdminService {
  private readonly app = this.initializeApp();

  async verifyIdToken(token: string): Promise<DecodedIdToken> {
    if (this.isDevAuthEnabled() && token.startsWith('dev:')) {
      return this.buildDevToken(token);
    }

    const auth = this.getAuth();

    try {
      return await auth.verifyIdToken(token);
    } catch {
      throw new UnauthorizedException('Invalid Firebase ID token.');
    }
  }

  isConfigured() {
    return Boolean(this.app);
  }

  getStorageBucketOrNull() {
    if (!this.app?.options.storageBucket) {
      return null;
    }

    return admin.storage(this.app).bucket();
  }

  private getAuth() {
    if (!this.app) {
      throw new ServiceUnavailableException(
        'Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_PATH or the FIREBASE_* credentials before using /me endpoints.',
      );
    }

    return admin.auth(this.app);
  }

  private initializeApp() {
    if (admin.apps.length > 0) {
      return admin.app();
    }

    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET?.trim();
    const hasApplicationDefaultCredentials = Boolean(
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.FIREBASE_AUTH_EMULATOR_HOST ||
        process.env.K_SERVICE ||
        process.env.FUNCTION_TARGET,
    );

    const serviceAccountPath =
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim();

    if (serviceAccountPath) {
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
        storageBucket: storageBucket || undefined,
      });
    }

    const inlineServiceAccount = this.readInlineServiceAccount();
    if (inlineServiceAccount) {
      return admin.initializeApp({
        credential: admin.credential.cert(inlineServiceAccount),
        storageBucket: storageBucket || undefined,
      });
    }

    if (hasApplicationDefaultCredentials) {
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: storageBucket || undefined,
      });
    }

    return undefined;
  }

  private readInlineServiceAccount(): FirebaseServiceAccount | undefined {
    const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')
      .trim();

    if (!projectId || !clientEmail || !privateKey) {
      return undefined;
    }

    return {
      projectId,
      clientEmail,
      privateKey,
    };
  }

  private isDevAuthEnabled() {
    return process.env.FIREBASE_DEV_AUTH === 'true';
  }

  private buildDevToken(token: string): DecodedIdToken {
    const rawPayload = token.slice(4).trim();
    const [uid, email, name] = rawPayload
      .split('|')
      .map((value) => value?.trim());

    if (!uid) {
      throw new UnauthorizedException(
        'Invalid dev token. Use Bearer dev:<uid>|<email>|<name> when FIREBASE_DEV_AUTH=true.',
      );
    }

    const timestampSeconds = Math.floor(Date.now() / 1000);

    return {
      aud: 'dev-project',
      auth_time: timestampSeconds,
      exp: timestampSeconds + 3600,
      firebase: {
        identities: {},
        sign_in_provider: 'custom',
      },
      iat: timestampSeconds,
      iss: 'https://securetoken.google.com/dev-project',
      sub: uid,
      uid,
      email: email || undefined,
      email_verified: Boolean(email),
      name: name || undefined,
    } as DecodedIdToken;
  }
}
