import { DataSource, DataSourceOptions } from 'typeorm';

function buildOptions(): DataSourceOptions {
  const url = process.env.DATABASE_URL;

  if (url) {
    return {
      type: 'postgres',
      url,
      ssl: false,
      entities: [__dirname + '/entities/*.{ts,js}'],
      migrations: [__dirname + '/migrations/*.{ts,js}'],
      synchronize: false,
      logging: false,
    };
  }

  return {
    type: 'postgres',
    host: process.env.APP_DB_HOST || 'localhost',
    port: parseInt(process.env.APP_DB_PORT || '5432', 10),
    database: process.env.APP_DB_NAME || 'task_tracker',
    username: process.env.APP_DB_USER || 'postgres',
    password: process.env.APP_DB_PASSWORD || 'postgres',
    ssl: false,
    entities: [__dirname + '/entities/*.{ts,js}'],
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    synchronize: false,
    logging: false,
  };
}

const dataSource = new DataSource(buildOptions());
export default dataSource;
