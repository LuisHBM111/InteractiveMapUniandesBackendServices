import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdsModule } from './ads/ads.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MeModule } from './me/me.module';
import { PlacesModule } from './places/places.module';
import { RoutesModule } from './routes/routes.module';
import { SchedulesModule } from './schedules/schedules.module';
import { SetupModule } from './setup/setup.module';
import { UsersModule } from './users/users.module';

const databasePort = Number(process.env.DB_PORT ?? 5432);
const databaseHost = process.env.DB_HOST ?? 'localhost';
const databaseUsername = process.env.DB_USERNAME ?? 'postgres';
const databasePassword = process.env.DB_PASSWORD ?? '123';
const databaseName = process.env.DB_NAME ?? 'InteractiveMapUniandes';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: databaseHost,
      port: databasePort,
      username: databaseUsername,
      password: databasePassword,
      database: databaseName,
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
    }),
    UsersModule,
    SchedulesModule,
    PlacesModule,
    RoutesModule,
    SetupModule,
    MeModule,
    AnalyticsModule,
    AdsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
