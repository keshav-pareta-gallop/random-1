import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './create-task.dto';
import { Task } from '../entities/task.entity';

interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  assigneeId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function serializeTask(task: Task): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    assigneeId: task.assigneeId,
    createdBy: task.createdBy,
    createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : String(task.createdAt),
    updatedAt: task.updatedAt instanceof Date ? task.updatedAt.toISOString() : String(task.updatedAt),
  };
}

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(
    @Body() dto: CreateTaskDto,
    @Req() req: Request,
  ): Promise<TaskResponse> {
    const user = (req as any).user;
    const task = await this.tasksService.create(dto, user);
    return serializeTask(task);
  }

  @Get()
  async findAll(): Promise<TaskResponse[]> {
    const tasks = await this.tasksService.findAll();
    return tasks.map(serializeTask);
  }
}
