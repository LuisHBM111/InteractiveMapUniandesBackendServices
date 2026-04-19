import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsUUID } from 'class-validator';
import { normalizeOptionalString } from '../../common/utils/dto-transform.util';

export class ListSchedulesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => normalizeOptionalString(value))
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @Transform(({ value }) => normalizeOptionalString(value))
  userEmail?: string;
}
