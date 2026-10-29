import { TasksService } from './tasks.service';
import { Task } from '../entities/task.entity';

describe('TasksService', () => {
  let service: TasksService;
  let taskRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
  };
  let teamMemberService: {
    findOrCreate: jest.Mock;
  };

  const mockMember = { id: 'member-uuid-1', firebaseUid: 'fb-123', name: 'Alice', email: 'alice@example.com' };
  const authUser = { uid: 'fb-123', name: 'Alice', email: 'alice@example.com' };

  beforeEach(() => {
    taskRepo = {
      create: jest.fn((data) => ({ ...data, id: 'task-uuid-1', createdAt: new Date(), updatedAt: new Date() } as unknown as Task)),
      save: jest.fn((entity) => Promise.resolve(entity)),
      find: jest.fn(),
    };
    teamMemberService = {
      findOrCreate: jest.fn().mockResolvedValue(mockMember),
    };
    service = new TasksService(taskRepo as any, teamMemberService as any);
  });

  describe('create', () => {
    it('calls findOrCreate with the auth user, then creates and saves the task', async () => {
      const dto = { title: 'My Task', description: 'desc', dueDate: '2026-12-01' };

      const result = await service.create(dto, authUser);

      expect(teamMemberService.findOrCreate).toHaveBeenCalledWith('fb-123', 'Alice', 'alice@example.com');
      expect(taskRepo.create).toHaveBeenCalledWith({
        title: 'My Task',
        description: 'desc',
        dueDate: '2026-12-01',
        status: 'todo',
        createdBy: 'member-uuid-1',
      });
      expect(taskRepo.save).toHaveBeenCalledWith(result);
    });

    it('defaults optional fields to null', async () => {
      const dto = { title: 'Only Title' };

      await service.create(dto, authUser);

      expect(taskRepo.create).toHaveBeenCalledWith({
        title: 'Only Title',
        description: null,
        dueDate: null,
        status: 'todo',
        createdBy: 'member-uuid-1',
      });
    });
  });

  describe('findAll', () => {
    it('calls taskRepo.find with DESC order and returns result', async () => {
      const tasks = [{ id: '1' }, { id: '2' }] as Task[];
      taskRepo.find.mockResolvedValue(tasks);

      const result = await service.findAll();

      expect(taskRepo.find).toHaveBeenCalledWith({ order: { createdAt: 'DESC' } });
      expect(result).toBe(tasks);
    });
  });
});
