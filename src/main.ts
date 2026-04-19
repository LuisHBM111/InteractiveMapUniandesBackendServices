import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { createAppValidationPipe } from './common/pipes/app-validation.pipe';
import { AppModule } from './app.module';
import { environment } from './common/config/environment.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(createAppValidationPipe());
  app.useGlobalFilters(new AppExceptionFilter());
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
    defaultVersion: '1',
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('InteractiveMapUniandes Backend')
    .setDescription(
      'Browser-based documentation and testing UI for the InteractiveMapUniandes backend.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Firebase ID token. In local development, if FIREBASE_DEV_AUTH=true, you can also use Bearer dev:<uid>|<email>|<name>.',
      },
      'firebase',
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(environment.appPort);
}
bootstrap();
