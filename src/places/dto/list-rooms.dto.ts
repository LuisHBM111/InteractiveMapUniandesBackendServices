import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListRoomsDto {
  @ApiPropertyOptional({
    example: 'ML_340',
  })
  search?: string;

  @ApiPropertyOptional()
  buildingId?: string;
}
