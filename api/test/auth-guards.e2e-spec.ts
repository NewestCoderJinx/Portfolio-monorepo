import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';

const ID = '00000000-0000-4000-8000-000000000000';

// Every admin route must reject anonymous callers. Keep this list in step with
// the @UseGuards(JwtAuthGuard) routes in the controllers.
const PROTECTED: Array<[method: 'get' | 'post' | 'patch' | 'delete', path: string]> = [
  ['get', '/auth/me'],
  ['patch', '/auth/password'],
  ['patch', '/profile'],
  ['post', '/profile/resume'],
  ['get', '/projects/manage'],
  ['get', '/projects/stats'],
  ['post', '/projects'],
  ['patch', '/projects/reorder'],
  ['patch', `/projects/${ID}`],
  ['delete', `/projects/${ID}`],
  ['post', '/projects/upload'],
  ['post', '/skills'],
  ['patch', '/skills/reorder'],
  ['patch', `/skills/${ID}`],
  ['delete', `/skills/${ID}`],
  ['post', '/experience'],
  ['patch', `/experience/${ID}`],
  ['delete', `/experience/${ID}`],
  ['post', '/credentials'],
  ['patch', `/credentials/${ID}`],
  ['delete', `/credentials/${ID}`],
  ['get', '/messages'],
  ['get', '/messages/alerts'],
  ['post', '/messages/alerts/test'],
  ['patch', '/messages/read-all'],
  ['patch', `/messages/${ID}`],
  ['delete', `/messages/${ID}`],
  ['get', '/testimonials/manage'],
  ['post', '/testimonials'],
  ['patch', `/testimonials/${ID}`],
  ['delete', `/testimonials/${ID}`],
  ['get', '/posts/manage'],
  ['post', '/posts'],
  ['patch', `/posts/${ID}`],
  ['delete', `/posts/${ID}`],
  ['get', '/testimonial-requests'],
  ['post', '/testimonial-requests'],
  ['delete', `/testimonial-requests/${ID}`],
];

describe('Admin routes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(PROTECTED)('%s %s rejects requests without a token', async (method, path) => {
    await request(app.getHttpServer())[method](path).expect(401);
  });

  it.each(PROTECTED)('%s %s rejects a forged token', async (method, path) => {
    await request(app.getHttpServer())[method](path).set('Authorization', 'Bearer not.a.real.token').expect(401);
  });

  it('leaves the public routes open', async () => {
    const server = app.getHttpServer();
    for (const path of ['/projects', '/skills', '/experience', '/credentials', '/testimonials', '/posts']) {
      const res = await request(server).get(path);
      expect(res.status, path).toBe(200);
    }
  });
});
