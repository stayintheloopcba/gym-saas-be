import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MaxLength, MinLength } from 'class-validator';

export class RoutineItemDto {
  @ApiProperty({ example: 'Back squat' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  exerciseName: string;

  @ApiProperty({ example: 4, minimum: 1 })
  @IsInt()
  @Min(1)
  sets: number;

  @ApiProperty({ example: '8-12' })
  @IsString()
  @MaxLength(32)
  reps: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(512)
  notes?: string;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsInt()
  @Min(0)
  order: number;
}
