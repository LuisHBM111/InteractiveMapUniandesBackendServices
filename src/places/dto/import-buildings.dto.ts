import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportBuildingsDto {
  @ApiPropertyOptional({
    example:
      'C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/src/utils/edificios_y_casas.xlsx',
  })
  filePath?: string;

  @ApiPropertyOptional({
    example: true,
  })
  replaceExisting?: boolean | string;
}
