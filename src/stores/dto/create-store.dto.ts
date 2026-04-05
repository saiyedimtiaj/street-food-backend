import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Momo Corner', maxLength: 150 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ example: 'Best momos in town' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Street Food' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: '123 Main St, City' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ example: 27.7172, description: 'Latitude (-90 to 90)' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({ example: 85.3240, description: 'Longitude (-180 to 180)' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;
}
