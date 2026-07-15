const request = require('supertest');
const app = require('../../app'); // Adjust path as needed

describe('Rewards API', () => {
  describe('POST /api/rewards/mint-points', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/rewards/mint-points')
        .send({ orderId: 'test', total: 100 });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/rewards/get-balance', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/rewards/get-balance');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/rewards/redeem-points', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/rewards/redeem-points')
        .send({ points: 50 });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });
});