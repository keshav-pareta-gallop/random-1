import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1698570000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE team_member (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        firebase_uid VARCHAR(128) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_team_member_firebase_uid ON team_member (firebase_uid);
    `);

    await queryRunner.query(`
      CREATE TABLE task (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATE,
        status VARCHAR(20) NOT NULL DEFAULT 'todo',
        assignee_id UUID REFERENCES team_member(id),
        created_by UUID NOT NULL REFERENCES team_member(id),
        created_at TIMESTAMP NOT NULL DEFAULT now(),
        updated_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX idx_task_status ON task (status);
    `);

    await queryRunner.query(`
      CREATE INDEX idx_task_created_by ON task (created_by);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS task;`);
    await queryRunner.query(`DROP TABLE IF EXISTS team_member;`);
  }
}
