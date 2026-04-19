import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppExceptionFilter } from '../src/common/filters/app-exception.filter';
import { createAppValidationPipe } from '../src/common/pipes/app-validation.pipe';

class TestValidationDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsBoolean()
  replaceExisting: boolean;
}

@Controller()
class TestAppController {
  @Get()
  getHello() {
    return 'ok';
  }

  @Get('not-found')
  notFound() {
    throw new NotFoundException('Resource was not found.');
  }

  @Post('validate')
  validateBody(@Body() body: TestValidationDto) {
    return body;
  }
}

describe('App hardening (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TestAppController],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(createAppValidationPipe());
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('ok');
  });

  it('returns a consistent error payload for not found routes', async () => {
    const response = await request(app.getHttpServer())
      .get('/not-found')
      .expect(404);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: 'Resource was not found.',
        path: '/not-found',
        timestamp: expect.any(String),
      }),
    );
  });

  it('returns validation errors with a consistent payload', async () => {
    const response = await request(app.getHttpServer())
      .post('/validate')
      .send({
        name: 123,
        replaceExisting: 'true',
        extraField: 'not-allowed',
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        statusCode: 400,
        error: 'Bad Request',
        path: '/validate',
        timestamp: expect.any(String),
      }),
    );
    expect(response.body.message).toEqual(
      expect.arrayContaining([
        'property extraField should not exist',
        'name must be a string',
        'replaceExisting must be a boolean value',
      ]),
    );
  });

  afterEach(async () => {
    await app.close();
  });
});
