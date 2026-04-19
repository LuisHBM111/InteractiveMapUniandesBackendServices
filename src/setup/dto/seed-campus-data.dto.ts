import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  normalizeOptionalString,
  toBooleanIfDefined,
} from '../../common/utils/dto-transform.util';

export class SeedCampusDataDto {
  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanIfDefined(value))
  replaceExisting?: boolean;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanIfDefined(value))
  bidirectional?: boolean;

  @ApiPropertyOptional({
    example:
      'C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/src/utils/edificios_y_casas.xlsx',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => normalizeOptionalString(value))
  buildingsFilePath?: string;

  @ApiPropertyOptional({
    example:
      'C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/src/utils/move.xlsx',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => normalizeOptionalString(value))
  graphFilePath?: string;
}
