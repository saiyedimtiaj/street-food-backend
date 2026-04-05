import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe', minLength: 2, maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'I love street food!', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
