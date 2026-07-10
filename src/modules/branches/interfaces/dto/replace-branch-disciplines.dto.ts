import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ReplaceBranchDisciplinesDto {
  @ApiProperty({ type: String, isArray: true, format: 'uuid' })
  @IsUUID('4', { each: true })
  disciplineIds: string[];
}
