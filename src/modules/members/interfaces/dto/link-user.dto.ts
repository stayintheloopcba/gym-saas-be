import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

/** Vincula un `User` existente al member por email, o crea uno nuevo. */
export class LinkUserDto {
  @ApiProperty({ format: 'email' })
  @IsEmail()
  email: string;
}
