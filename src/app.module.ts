import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || undefined,
      host: process.env.DATABASE_URL ? undefined : (process.env.APP_DB_HOST || 'localhost'),
      port: process.env.DATABASE_URL ? undefined : parseInt(process.env.APP_DB_PORT || '5432', 10),
      database: process.env.DATABASE_URL ? undefined : (process.env.APP_DB_NAME || 'task_tracker'),
      username: process.env.DATABASE_URL ? undefined : (process.env.APP_DB_USER || 'postgres'),
      password: process.env.DATABASE_URL ? undefined : (process.env.APP_DB_PASSWORD || 'postgres'),
      ssl: false,
      autoLoadEntities: true,
      synchronize: false,
      logging: false,
    }),
  ],
})
export class AppModule {}
