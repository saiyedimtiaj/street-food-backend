import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReplyDto {
  @ApiProperty({ example: 'Thank you for your review!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reply_text: string;
}

export class UpdateReplyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reply_text?: string;
}
