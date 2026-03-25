import { updateProfileSchema } from '../../validators/schemas/auth.schema';

describe('updateProfileSchema', () => {
  const parse = (body: object) =>
    updateProfileSchema.safeParse({ body });

  describe('country field', () => {
    it('accepts a valid country string (≤100 chars)', () => {
      const result = parse({ country: 'Brazil' });
      expect(result.success).toBe(true);
    });

    it('rejects country longer than 100 characters', () => {
      const result = parse({ country: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('city field', () => {
    it('accepts a valid city string (≤100 chars)', () => {
      const result = parse({ city: 'São Paulo' });
      expect(result.success).toBe(true);
    });

    it('rejects city longer than 100 characters', () => {
      const result = parse({ city: 'B'.repeat(101) });
      expect(result.success).toBe(false);
    });
  });

  describe('birthDate field', () => {
    it('accepts a valid ISO date string', () => {
      const result = parse({ birthDate: '1990-05-15' });
      expect(result.success).toBe(true);
    });
  });

  describe('all new fields are optional', () => {
    it('accepts empty body without country, city or birthDate', () => {
      const result = parse({});
      expect(result.success).toBe(true);
    });
  });
});
