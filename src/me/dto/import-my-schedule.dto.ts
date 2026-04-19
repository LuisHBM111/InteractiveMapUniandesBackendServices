import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  normalizeOptionalString,
  toBooleanIfDefined,
} from '../../common/utils/dto-transform.util';

export class ImportMyScheduleDto {
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

  @ApiPropertyOptional({
    example: 'https://registroapps.uniandes.edu.co',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => normalizeOptionalString(value))
  sourceUrl?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanIfDefined(value))
  replaceExisting?: boolean;
}
