import request from 'supertest';
import { app } from '../../server';

describe('GET /health', () => {
  it('returns 200 with healthy status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
    expect(response.body.service).toBe('maratona-backend');
  });

  it('includes timestamp in response', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp).getTime()).not.toBeNaN();
  });
});

describe('GET /api', () => {
  it('returns 200 with API info', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);

    expect(response.body.message).toBe('Maratona Ao Vivo API');
    expect(response.body.version).toBeDefined();
    expect(response.body.endpoints).toBeDefined();
  });
});
