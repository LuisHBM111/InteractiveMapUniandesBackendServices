import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { normalizeOptionalString } from '../../common/utils/dto-transform.util';

export class CalculateClassPathDto {
  @ApiProperty({
    example: 'ML',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => normalizeOptionalString(value))
  from: string;

  @ApiProperty()
  @IsUUID()
  @Transform(({ value }) => normalizeOptionalString(value))
  classId: string;
}
