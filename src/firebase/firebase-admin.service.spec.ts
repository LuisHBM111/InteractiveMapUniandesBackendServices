import { FirebaseAdminService } from './firebase-admin.service';

describe('FirebaseAdminService', () => {
  const originalDevAuth = process.env.FIREBASE_DEV_AUTH;

  beforeEach(() => {
    process.env.FIREBASE_DEV_AUTH = 'true';
  });

  afterAll(() => {
    if (originalDevAuth === undefined) {
      delete process.env.FIREBASE_DEV_AUTH;
      return;
    }

    process.env.FIREBASE_DEV_AUTH = originalDevAuth;
  });

  it('accepts a local dev token when FIREBASE_DEV_AUTH is enabled', async () => {
    const service = new FirebaseAdminService();
    const decodedToken = await service.verifyIdToken(
      'dev:demo-user|demo@uniandes.edu.co|Demo Uniandes',
    );

    expect(decodedToken.uid).toBe('demo-user');
    expect(decodedToken.email).toBe('demo@uniandes.edu.co');
    expect(decodedToken.name).toBe('Demo Uniandes');
    expect(decodedToken.firebase.sign_in_provider).toBe('custom');
  });
});
