import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'store-uuid-here' })
  @IsUUID()
  store_id: string;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great food!', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
