import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('healthz')
  async getHealth(@Res({ passthrough: true }) response: Response) {
    const health = await this.appService.getHealth();

    if (health.status !== 'ok') {
      response.status(503);
    }

    return health;
  }
}
