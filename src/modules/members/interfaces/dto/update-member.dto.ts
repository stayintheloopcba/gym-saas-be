import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * Actualización parcial de los datos personales del `Member`. Todos los
 * campos son opcionales; el use case aplica solo los provistos. El `roleId`
 * se cambia únicamente vía `PATCH .../members/:memberId/role`.
 */
export class UpdateMemberDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ example: 'Ada' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Lovelace' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  lastName?: string;

  @ApiPropertyOptional({ example: '30111222' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  documentId?: string;

  @ApiPropertyOptional({ format: 'email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+54 9 11 5555-5555' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContactName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(32)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  consents?: Record<string, unknown>;
}
