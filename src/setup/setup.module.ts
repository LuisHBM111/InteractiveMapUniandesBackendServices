import { Module } from '@nestjs/common';
import { PlacesModule } from '../places/places.module';
import { RoutesModule } from '../routes/routes.module';
import { SetupController } from './setup.controller';
import { SetupGuard } from './setup.guard';
import { SetupService } from './setup.service';

@Module({
  imports: [PlacesModule, RoutesModule],
  controllers: [SetupController],
  providers: [SetupService, SetupGuard],
})
export class SetupModule {}
