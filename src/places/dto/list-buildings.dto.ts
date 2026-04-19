import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { normalizeOptionalString } from '../../common/utils/dto-transform.util';

export class ListBuildingsDto {
  @ApiPropertyOptional({
    example: 'ML',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => normalizeOptionalString(value))
  search?: string;
}
