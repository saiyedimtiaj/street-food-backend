import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFoodDto {
  @ApiProperty({ example: 'beef-store-uuid' })
  @IsUUID()
  store_id: string;

  @ApiProperty({ example: 'Spicy Momo', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Steamed dumplings with spicy sauce' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150 })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ example: 'https://cloudinary.com/...' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_available?: boolean;
}
