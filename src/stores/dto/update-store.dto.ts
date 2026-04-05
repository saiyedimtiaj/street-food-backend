import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreDto {
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
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'JSON array of gallery public_ids to remove',
    example: '["street-food/stores/gallery/abc123"]',
  })
  @IsOptional()
  @IsString()
  gallery_remove?: string;
}
