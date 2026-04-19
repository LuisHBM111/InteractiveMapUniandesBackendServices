import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { normalizeOptionalString } from '../../common/utils/dto-transform.util';

export class ListRoomsDto {
  @ApiPropertyOptional({
    example: 'ML_340',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => normalizeOptionalString(value))
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @Transform(({ value }) => normalizeOptionalString(value))
  buildingId?: string;
}
