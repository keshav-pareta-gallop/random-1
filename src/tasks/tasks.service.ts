import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TeamMemberService } from '../team-member/team-member.service';
import { CreateTaskDto } from './create-task.dto';

interface AuthUser {
  uid: string;
  name: string;
  email: string;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    private readonly teamMemberService: TeamMemberService,
  ) {}

  async create(dto: CreateTaskDto, user: AuthUser): Promise<Task> {
    const member = await this.teamMemberService.findOrCreate(user.uid, user.name, user.email);

    const task = this.taskRepo.create({
      title: dto.title,
      description: dto.description || null,
      dueDate: dto.dueDate || null,
      status: 'todo',
      createdBy: member.id,
    });

    return this.taskRepo.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepo.find({ order: { createdAt: 'DESC' } });
  }
}
