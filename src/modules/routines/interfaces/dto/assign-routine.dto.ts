import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignRoutineDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  memberId: string;
}
