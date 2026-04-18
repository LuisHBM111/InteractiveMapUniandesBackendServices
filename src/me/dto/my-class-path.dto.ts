import { ApiProperty } from '@nestjs/swagger';

export class MyClassPathDto {
  @ApiProperty({
    example: 'ML',
  })
  from: string;
}
