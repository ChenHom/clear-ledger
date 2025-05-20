import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const dbType = process.env.DB_TYPE || 'sqlite';

const AppDataSource = new DataSource(
  dbType === 'sqlite'
    ? {
        type: 'sqlite',
        database: process.env.DB_SQLITE_PATH || './data/clear_ledger.sqlite',
        entities: [__dirname + '/wallet/*.entity.{ts,js}'],
        migrations: [__dirname + '/../migrations/*.{ts,js}'],
        synchronize: false,
      }
    : {
        type: 'mysql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        entities: [__dirname + '/wallet/*.entity.{ts,js}'],
        migrations: [__dirname + '/../migrations/*.{ts,js}'],
        synchronize: false,
      }
);

export default AppDataSource;
