import sequelize from '../config/database';
import '../models/associations';

beforeAll(async () => {
  await sequelize.authenticate();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});
