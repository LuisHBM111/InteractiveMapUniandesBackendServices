import { ApiProperty } from '@nestjs/swagger';

export class CalculateClassPathDto {
  @ApiProperty({
    example: 'ML',
  })
  from: string;

  @ApiProperty()
  classId: string;
}
