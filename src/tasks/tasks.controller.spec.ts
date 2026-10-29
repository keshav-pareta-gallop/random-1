import { TasksController } from './tasks.controller';
import { Task } from '../entities/task.entity';

describe('TasksController', () => {
  let controller: TasksController;
  let tasksService: {
    create: jest.Mock;
    findAll: jest.Mock;
  };

  const now = new Date('2026-10-29T10:30:00.000Z');

  const mockTask: Task = {
    id: 'task-uuid-1',
    title: 'Test Task',
    description: 'A description',
    dueDate: '2026-12-01',
    status: 'todo',
    assigneeId: null,
    createdBy: 'member-uuid-1',
    createdAt: now,
    updatedAt: now,
    assignee: null,
    creator: null as any,
  };

  beforeEach(() => {
    tasksService = {
      create: jest.fn(),
      findAll: jest.fn(),
    };
    controller = new TasksController(tasksService as any);
  });

  describe('create', () => {
    it('passes dto and req.user to service.create and returns serialized task', async () => {
      tasksService.create.mockResolvedValue(mockTask);
      const dto = { title: 'Test Task', description: 'A description', dueDate: '2026-12-01' };
      const req = { user: { uid: 'fb-123', name: 'Alice', email: 'alice@example.com' } } as any;

      const result = await controller.create(dto as any, req);

      expect(tasksService.create).toHaveBeenCalledWith(dto, req.user);
      expect(result).toEqual({
        id: 'task-uuid-1',
        title: 'Test Task',
        description: 'A description',
        dueDate: '2026-12-01',
        status: 'todo',
        assigneeId: null,
        createdBy: 'member-uuid-1',
        createdAt: '2026-10-29T10:30:00.000Z',
        updatedAt: '2026-10-29T10:30:00.000Z',
      });
    });
  });

  describe('findAll', () => {
    it('returns array of serialized tasks', async () => {
      tasksService.findAll.mockResolvedValue([mockTask]);

      const result = await controller.findAll();

      expect(tasksService.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'task-uuid-1',
        title: 'Test Task',
        description: 'A description',
        dueDate: '2026-12-01',
        status: 'todo',
        assigneeId: null,
        createdBy: 'member-uuid-1',
        createdAt: '2026-10-29T10:30:00.000Z',
        updatedAt: '2026-10-29T10:30:00.000Z',
      });
    });

    it('serializes null description, dueDate, assigneeId correctly', async () => {
      const nullTask: Task = {
        ...mockTask,
        description: null,
        dueDate: null,
        assigneeId: null,
      };
      tasksService.findAll.mockResolvedValue([nullTask]);

      const result = await controller.findAll();

      expect(result[0].description).toBeNull();
      expect(result[0].dueDate).toBeNull();
      expect(result[0].assigneeId).toBeNull();
    });
  });
});
