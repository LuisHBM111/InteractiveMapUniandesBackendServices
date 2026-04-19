import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  normalizeOptionalString,
  toBooleanIfDefined,
} from '../../common/utils/dto-transform.util';

export class ImportBuildingsDto {
  @ApiPropertyOptional({
    example:
      'C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/src/utils/edificios_y_casas.xlsx',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => normalizeOptionalString(value))
  filePath?: string;

  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => toBooleanIfDefined(value))
  replaceExisting?: boolean;
}
