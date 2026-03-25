import { getDatabaseName } from '../../config/database';

describe('getDatabaseName', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDbName = process.env.DB_NAME;
  const originalDbTestName = process.env.DB_TEST_NAME;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalDbName !== undefined) {
      process.env.DB_NAME = originalDbName;
    } else {
      delete process.env.DB_NAME;
    }
    if (originalDbTestName !== undefined) {
      process.env.DB_TEST_NAME = originalDbTestName;
    } else {
      delete process.env.DB_TEST_NAME;
    }
  });

  it('returns DB_TEST_NAME when NODE_ENV is test', () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_TEST_NAME = 'maratona_test';
    expect(getDatabaseName()).toBe('maratona_test');
  });

  it('defaults to maratona_test when NODE_ENV is test and DB_TEST_NAME is not set', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.DB_TEST_NAME;
    expect(getDatabaseName()).toBe('maratona_test');
  });

  it('returns DB_NAME when NODE_ENV is development', () => {
    process.env.NODE_ENV = 'development';
    process.env.DB_NAME = 'maratona_db';
    expect(getDatabaseName()).toBe('maratona_db');
  });

  it('defaults to maratona_db when NODE_ENV is development and DB_NAME is not set', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DB_NAME;
    expect(getDatabaseName()).toBe('maratona_db');
  });
});
