import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { RoutesModule } from '../routes/routes.module';
import { SchedulesModule } from '../schedules/schedules.module';
import { UsersModule } from '../users/users.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';

@Module({
  imports: [FirebaseModule, UsersModule, SchedulesModule, RoutesModule],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
