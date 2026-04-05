import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFoodDto {
  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_available?: boolean;
}
