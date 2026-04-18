import { ApiPropertyOptional } from '@nestjs/swagger';

export class SeedCampusDataDto {
  @ApiPropertyOptional({
    example: true,
  })
  replaceExisting?: boolean | string;

  @ApiPropertyOptional({
    example: true,
  })
  bidirectional?: boolean | string;

  @ApiPropertyOptional({
    example:
      'C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/src/utils/edificios_y_casas.xlsx',
  })
  buildingsFilePath?: string;

  @ApiPropertyOptional({
    example:
      'C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/src/utils/move.xlsx',
  })
  graphFilePath?: string;
}
