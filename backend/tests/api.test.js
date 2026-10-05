process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.UPLOAD_DIR = require('path').join(require('os').tmpdir(), 'unifind-test-uploads');

const request = require('supertest');
const app = require('../src/app');

// These tests do not need a running database: every request below
// is answered before any query is made.
describe('UniFind API (no database required)', () => {
  test('GET /api/health reports the service is up', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('unifind-api');
  });

  test('unknown routes return 404 JSON', async () => {
    const res = await request(app).get('/api/nothing-here');
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('registering without required fields returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.lk' });
    expect(res.statusCode).toBe(400);
  });

  test('registering with a short password returns 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@student.lk', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/6 characters/);
  });

  test('logging in without credentials returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  test('protected routes reject requests without a token', async () => {
    const paths = ['/api/items/mine', '/api/claims/mine', '/api/claims/received', '/api/auth/me'];
    for (const p of paths) {
      const res = await request(app).get(p);
      expect(res.statusCode).toBe(401);
    }
  });

  test('admin routes reject requests without a token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });

  test('a malformed token is rejected', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-real-token');
    expect(res.statusCode).toBe(401);
  });
});
