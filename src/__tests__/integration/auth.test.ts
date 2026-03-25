import request from 'supertest';
import { app } from '../../server';

const BASE = '/api/auth';

const validUser = {
  username: 'authtest1',
  email: 'authtest1@example.com',
  password: 'Password123',
  confirmPassword: 'Password123',
  firstName: 'Auth',
  lastName: 'Test',
};

describe('POST /api/auth/register', () => {
  it('registers a new user and returns tokens', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send(validUser)
      .expect(201);

    expect(res.body.message).toBe('User registered successfully.');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 409 when email is already registered', async () => {
    await request(app).post(`${BASE}/register`).send({
      username: 'dupemail1',
      email: 'duptest@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username: 'dupemail2',
        email: 'duptest@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(409);

    expect(res.body.error.code).toBe('EMAIL_EXISTS');
  });

  it('returns 409 when username is already taken', async () => {
    await request(app).post(`${BASE}/register`).send({
      username: 'dupname',
      email: 'unique1@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username: 'dupname',
        email: 'unique2@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(409);

    expect(res.body.error.code).toBe('USERNAME_EXISTS');
  });

  it('returns 400 for invalid email', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username: 'bademail',
        email: 'not-an-email',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for username too short', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username: 'ab',
        email: 'short@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for weak password', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username: 'weakpass',
        email: 'weakpass@example.com',
        password: 'password',
        confirmPassword: 'password',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when passwords do not match', async () => {
    const res = await request(app)
      .post(`${BASE}/register`)
      .send({
        username: 'mismatch',
        email: 'mismatch@example.com',
        password: 'Password123',
        confirmPassword: 'Password456',
      })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await request(app).post(`${BASE}/register`).send({
      username: 'logintest',
      email: 'logintest@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });
  });

  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'logintest@example.com', password: 'Password123' })
      .expect(200);

    expect(res.body.message).toBe('Login successful.');
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('logintest@example.com');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'logintest@example.com', password: 'WrongPass123' })
      .expect(401);

    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'nobody@example.com', password: 'Password123' })
      .expect(401);

    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'bad-email', password: 'Password123' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 400 for missing password', async () => {
    const res = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'logintest@example.com' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/auth/profile', () => {
  let authToken: string;

  beforeAll(async () => {
    await request(app).post(`${BASE}/register`).send({
      username: 'profiletest',
      email: 'profiletest@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      firstName: 'Profile',
      lastName: 'Tester',
    });

    const loginRes = await request(app)
      .post(`${BASE}/login`)
      .send({ email: 'profiletest@example.com', password: 'Password123' });

    authToken = loginRes.body.data.token;
  });

  it('returns profile for authenticated user', async () => {
    const res = await request(app)
      .get(`${BASE}/profile`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.data.user.email).toBe('profiletest@example.com');
    expect(res.body.data.user.firstName).toBe('Profile');
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('returns 401 without Authorization header', async () => {
    await request(app).get(`${BASE}/profile`).expect(401);
  });

  it('returns 401 with invalid token', async () => {
    await request(app)
      .get(`${BASE}/profile`)
      .set('Authorization', 'Bearer invalid.token.here')
      .expect(401);
  });
});

describe('GET /api/auth/health', () => {
  it('returns healthy status', async () => {
    const res = await request(app).get(`${BASE}/health`).expect(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toBe('auth-service');
  });
});
