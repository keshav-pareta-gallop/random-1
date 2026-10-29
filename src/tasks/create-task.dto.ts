import { IsNotEmpty, IsOptional, IsString, MaxLength, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTaskDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  @MaxLength(255, { message: 'Title must not exceed 255 characters' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description must not exceed 5000 characters' })
  description?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate?: string;
}
