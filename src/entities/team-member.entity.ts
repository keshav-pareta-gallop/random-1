import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from './task.entity';

@Entity('team_member')
export class TeamMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'firebase_uid', type: 'varchar', length: 128, unique: true })
  firebaseUid!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 20, default: 'member' })
  role!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'now()' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'now()' })
  updatedAt!: Date;

  @OneToMany(() => Task, (task) => task.creator)
  createdTasks!: Task[];

  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks!: Task[];
}
