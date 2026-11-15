import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseConfig } from './database.config';

// For the TypeORM CLI (npm run migration:*). Loads api/.env like the app does in development.
try {
  process.loadEnvFile();
} catch {
  /* no .env file: rely on real environment variables */
}

export default new DataSource(databaseConfig());
