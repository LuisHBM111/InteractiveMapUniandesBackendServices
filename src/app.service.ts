import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getHealth() {
    const database = await this.checkDatabase();
    const storageBucket = this.firebaseAdminService.getStorageBucketOrNull();

    return {
      status: database.status === 'up' ? 'ok' : 'degraded',
      service: 'interactive-map-uniandes-backend-services',
      timestamp: new Date().toISOString(),
      checks: {
        database,
        firebaseAdmin: {
          status: this.firebaseAdminService.isConfigured() ? 'up' : 'down',
        },
        firebaseStorage: {
          status: storageBucket ? 'up' : 'down',
          bucket: storageBucket?.name ?? null,
        },
      },
    };
  }

  private async checkDatabase() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (error) {
      return {
        status: 'down',
        message:
          error instanceof Error ? error.message : 'Database check failed.',
      };
    }
  }
}
