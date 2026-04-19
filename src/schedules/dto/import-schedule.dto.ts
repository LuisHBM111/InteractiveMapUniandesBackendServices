import { AuthProvider } from '../../common/enums/auth-provider.enum';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  normalizeOptionalString,
  toBooleanIfDefined,
} from '../../common/utils/dto-transform.util';

export class ImportScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => normalizeOptionalString(value))
  userId?: string;

  @ApiPropertyOptional({
    example: 'demo@uniandes.edu.co',
  })
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => normalizeOptionalString(value))
  userEmail?: string;

  @ApiPropertyOptional({
    enum: AuthProvider,
  })
  @IsOptional()
  @IsEnum(AuthProvider)
  authProvider?: AuthProvider;

  @ApiPropertyOptional({
    example: 'Horario semestre 2',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => normalizeOptionalString(value))
  name?: string;

  @ApiPropertyOptional({
    example: 'America/Bogota',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => normalizeOptionalString(value))
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => normalizeOptionalString(value))
  sourceUrl?: string;

  @ApiPropertyOptional({
    description: 'Raw .ics calendar content.',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeOptionalString(value))
  icsContent?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanIfDefined(value))
  replaceExisting?: boolean;
}
