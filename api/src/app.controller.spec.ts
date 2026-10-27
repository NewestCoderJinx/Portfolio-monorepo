import { Test, TestingModule } from '@nestjs/testing';
import { strictEqual } from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Controller } from '@nestjs/common/decorators/core/index.js';
import { Get } from '@nestjs/common/decorators/http/index.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });
@Controller()
export class AppController {
  @Get()
  getHealthStatus() {
    return {
      status: 'online',
      service: 'Engineering Evidence Platform API',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
  describe('root', () => {
    it('should return "Hello World!"', () => {
      strictEqual(appController.getHello(), 'Hello World!');
    });
  });
});

