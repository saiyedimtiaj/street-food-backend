import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSuggestionDto {
  @ApiProperty({ example: 'Uncle Bob Street Momos' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Amazing momos near the central park' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '45 Park Road, Kathmandu' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 27.7172 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 85.3240 })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? parseFloat(value) : undefined))
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
