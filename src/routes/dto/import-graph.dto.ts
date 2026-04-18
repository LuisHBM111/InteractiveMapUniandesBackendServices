import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportGraphDto {
  @ApiPropertyOptional({
    example:
      'C:/Users/PERSONAL/IdeaProjects/InteractiveMapUniandesBackendServices/src/utils/move.xlsx',
  })
  filePath?: string;

  @ApiPropertyOptional({
    example: true,
  })
  replaceExisting?: boolean | string;

  @ApiPropertyOptional({
    example: true,
  })
  bidirectional?: boolean | string;
}
