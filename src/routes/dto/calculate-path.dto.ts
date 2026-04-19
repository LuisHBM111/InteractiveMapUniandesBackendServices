import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { normalizeOptionalString } from '../../common/utils/dto-transform.util';

export class CalculatePathDto {
  @ApiProperty({
    example: 'ML',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => normalizeOptionalString(value))
  from: string;

  @ApiProperty({
    example: 'RGD',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(({ value }) => normalizeOptionalString(value))
  to: string;
}
