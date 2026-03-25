import { Sequelize, Dialect } from 'sequelize';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

export const getDatabaseName = (): string => {
  if (process.env.NODE_ENV === 'test') {
    return process.env.DB_TEST_NAME || 'maratona_test';
  }
  return process.env.DB_NAME || 'maratona_db';
};

const sequelize = new Sequelize(
  getDatabaseName(),
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    dialect: 'postgres' as Dialect,
    logging: process.env.NODE_ENV === 'development' ? (sql: string) => logger.debug('SQL Query', { sql }) : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
    define: {
      underscored: false,
      freezeTableName: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
      timestamps: true,
    },
  },
);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully');

    // Sync models (use with caution in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ Database synchronized');
    }

    return true;
  } catch (error: unknown) {
    const err = error as Error;
    logger.error('❌ Unable to connect to the database', {
      error: err.message,
      name: err.name,
    });

    // Provide helpful error messages
    if (err.name === 'SequelizeConnectionError') {
      logger.warn('💡 Troubleshooting tips:', {
        tips: [
          'Make sure PostgreSQL is running',
          'Check your database credentials in .env file',
          'Verify database name exists: maratona_db',
          'Check if user has proper permissions',
        ],
      });
    }

    return false;
  }
};

// Export sequelize instance and test function
export default sequelize;