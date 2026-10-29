import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateTaskDto } from './create-task.dto';

function toDto(plain: Record<string, unknown>): CreateTaskDto {
  return plainToInstance(CreateTaskDto, plain);
}

async function errors(plain: Record<string, unknown>): Promise<string[]> {
  const dto = toDto(plain);
  const errs = await validate(dto);
  return errs.flatMap((e) => Object.values(e.constraints || {}));
}

describe('CreateTaskDto', () => {
  it('accepts a valid payload with all fields', async () => {
    const msgs = await errors({
      title: 'My Task',
      description: 'Some description',
      dueDate: '2026-12-01',
    });
    expect(msgs).toHaveLength(0);
  });

  it('accepts a payload with only title', async () => {
    const msgs = await errors({ title: 'My Task' });
    expect(msgs).toHaveLength(0);
  });

  it('rejects missing title', async () => {
    const msgs = await errors({});
    expect(msgs).toContain('Title is required');
  });

  it('rejects whitespace-only title', async () => {
    const msgs = await errors({ title: '   ' });
    expect(msgs).toContain('Title is required');
  });

  it('rejects title exceeding 255 characters', async () => {
    const msgs = await errors({ title: 'a'.repeat(256) });
    expect(msgs).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Title must not exceed 255 characters'),
      ]),
    );
  });

  it('rejects invalid dueDate', async () => {
    const msgs = await errors({ title: 'Task', dueDate: 'not-a-date' });
    expect(msgs).toContain('Due date must be a valid date');
  });

  it('rejects description exceeding 5000 characters', async () => {
    const msgs = await errors({ title: 'Task', description: 'x'.repeat(5001) });
    expect(msgs).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Description must not exceed 5000 characters'),
      ]),
    );
  });
});
