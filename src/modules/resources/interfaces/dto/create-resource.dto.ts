import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ResourceStatus } from '../../domain/resource-status.enum';

export class CreateResourceDto {
  @ApiProperty({ example: 'Example resource', minLength: 1, maxLength: 255 })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Optional description', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: ResourceStatus, default: ResourceStatus.ACTIVE })
  @IsOptional()
  @IsEnum(ResourceStatus)
  status?: ResourceStatus;
}
