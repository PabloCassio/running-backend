import request from 'supertest';
import { app } from '../../server';

const AUTH_BASE = '/api/auth';
const RACE_BASE = '/api/races';

async function registerAndLogin(suffix: string): Promise<string> {
  await request(app)
    .post(`${AUTH_BASE}/register`)
    .send({
      username: `raceuser_${suffix}`,
      email: `raceuser_${suffix}@example.com`,
      password: 'Password123',
      confirmPassword: 'Password123',
    });

  const loginRes = await request(app)
    .post(`${AUTH_BASE}/login`)
    .send({
      email: `raceuser_${suffix}@example.com`,
      password: 'Password123',
    });

  return loginRes.body.data.token;
}

function futureDate(yearsAhead = 1): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + yearsAhead);
  return d.toISOString();
}

describe('GET /api/races', () => {
  it('returns 200 with races array', async () => {
    const res = await request(app).get(RACE_BASE).expect(200);
    expect(res.body.data.races).toBeDefined();
    expect(Array.isArray(res.body.data.races)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });

  it('accepts valid status filter', async () => {
    const res = await request(app)
      .get(`${RACE_BASE}?status=published`)
      .expect(200);
    expect(res.body.data.races).toBeDefined();
  });

  it('returns 400 for invalid status filter', async () => {
    const res = await request(app)
      .get(`${RACE_BASE}?status=invalid_status`)
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/races', () => {
  let authToken: string;

  beforeAll(async () => {
    authToken = await registerAndLogin('creator');
  });

  it('creates a race when authenticated', async () => {
    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Integration Test Marathon',
        date: futureDate(),
        location: 'Test City',
        distance: 42.195,
      })
      .expect(201);

    expect(res.body.data.race.name).toBe('Integration Test Marathon');
    expect(res.body.data.race.distance).toBe(42.195);
    expect(res.body.data.race.status).toBe('draft');
    expect(res.body.data.race.id).toBeDefined();
  });

  it('returns 401 without authentication', async () => {
    await request(app)
      .post(RACE_BASE)
      .send({ name: 'Unauth Race', date: futureDate(), location: 'Nowhere', distance: 5 })
      .expect(401);
  });

  it('returns 400 for missing name', async () => {
    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ date: futureDate(), location: 'Test', distance: 5 })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing location', async () => {
    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'No Location', date: futureDate(), distance: 5 })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing distance', async () => {
    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'No Distance', date: futureDate(), location: 'Somewhere' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing date', async () => {
    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'No Date', location: 'Somewhere', distance: 5 })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/races/:raceId', () => {
  let authToken: string;
  let raceId: number;

  beforeAll(async () => {
    authToken = await registerAndLogin('getter');

    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Race For Fetch Test',
        date: futureDate(),
        location: 'Fetch City',
        distance: 10,
      });

    raceId = res.body.data?.race?.id;
  });

  it('returns a race by numeric ID', async () => {
    if (!raceId) return;

    const res = await request(app)
      .get(`${RACE_BASE}/${raceId}`)
      .expect(200);

    expect(res.body.data.race.id).toBe(raceId);
    expect(res.body.data.race.name).toBe('Race For Fetch Test');
  });

  it('returns 404 for non-existent race ID', async () => {
    await request(app).get(`${RACE_BASE}/999999`).expect(404);
  });

  it('returns 400 for non-numeric raceId', async () => {
    const res = await request(app)
      .get(`${RACE_BASE}/not-a-number`)
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/races/:raceId', () => {
  let authToken: string;
  let raceId: number;

  beforeAll(async () => {
    authToken = await registerAndLogin('updater');

    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Race To Update',
        date: futureDate(),
        location: 'Update City',
        distance: 5,
      });

    raceId = res.body.data?.race?.id;
  });

  it('updates a race when authenticated as owner', async () => {
    if (!raceId) return;

    const res = await request(app)
      .put(`${RACE_BASE}/${raceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Race Name', distance: 10 })
      .expect(200);

    expect(res.body.data.race.name).toBe('Updated Race Name');
    expect(res.body.data.race.distance).toBe(10);
  });

  it('returns 401 without authentication', async () => {
    if (!raceId) return;

    await request(app)
      .put(`${RACE_BASE}/${raceId}`)
      .send({ name: 'Unauthorized Update' })
      .expect(401);
  });

  it('returns 403 when another user tries to update', async () => {
    if (!raceId) return;

    const otherToken = await registerAndLogin('other_updater');

    await request(app)
      .put(`${RACE_BASE}/${raceId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Unauthorized Update' })
      .expect(403);
  });

  it('returns 400 for non-numeric raceId', async () => {
    const res = await request(app)
      .put(`${RACE_BASE}/abc`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Bad ID' })
      .expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('DELETE /api/races/:raceId', () => {
  let authToken: string;
  let raceId: number;

  beforeAll(async () => {
    authToken = await registerAndLogin('deleter');

    const res = await request(app)
      .post(RACE_BASE)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Race To Delete',
        date: futureDate(),
        location: 'Delete City',
        distance: 3,
      });

    raceId = res.body.data?.race?.id;
  });

  it('returns 401 without authentication', async () => {
    if (!raceId) return;

    await request(app).delete(`${RACE_BASE}/${raceId}`).expect(401);
  });

  it('deletes a race when authenticated as owner', async () => {
    if (!raceId) return;

    await request(app)
      .delete(`${RACE_BASE}/${raceId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    await request(app).get(`${RACE_BASE}/${raceId}`).expect(404);
  });
});
