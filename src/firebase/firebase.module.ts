import { Global, Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { FirebaseAdminService } from './firebase-admin.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { FirebaseStorageService } from './firebase-storage.service';

@Global()
@Module({
  imports: [UsersModule],
  providers: [
    FirebaseAdminService,
    FirebaseAuthGuard,
    FirebaseStorageService,
  ],
  exports: [
    FirebaseAdminService,
    FirebaseAuthGuard,
    FirebaseStorageService,
  ],
})
export class FirebaseModule {}
