import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SetupService } from './setup.service';

function readBooleanEnv(name: string, defaultValue: boolean) {
  const value = process.env[name]?.trim();

  if (!value) {
    return defaultValue;
  }

  return value.toLowerCase() === 'true';
}

async function seedCampusData() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const setupService = app.get(SetupService);
    const result = await setupService.seedDefaultCampusData({
      replaceExisting: readBooleanEnv('SEED_REPLACE_EXISTING', true),
      bidirectional: readBooleanEnv('SEED_BIDIRECTIONAL', true),
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

seedCampusData().catch((error) => {
  console.error('Campus seed execution failed.', error);
  process.exit(1);
});
