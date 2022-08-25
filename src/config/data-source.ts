import { DataSource } from 'typeorm';
import 'dotenv/config';

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  logging: process.env.NODE_ENV === 'development',
  synchronize: process.env.NODE_ENV === 'development',
  entities: ['src/entity/*.ts'],
  migrations: ['src/migration/*.ts']
});

export default AppDataSource;
