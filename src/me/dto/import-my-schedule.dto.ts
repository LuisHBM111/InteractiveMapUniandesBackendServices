import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportMyScheduleDto {
  @ApiPropertyOptional({
    example: 'Horario semestre 2',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'America/Bogota',
  })
  timezone?: string;

  @ApiPropertyOptional({
    example: 'https://registroapps.uniandes.edu.co',
  })
  sourceUrl?: string;

  @ApiPropertyOptional({
    example: true,
  })
  replaceExisting?: boolean | string;
}
