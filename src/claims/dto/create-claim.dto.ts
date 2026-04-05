import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClaimDto {
  @ApiProperty({ example: 'store-uuid-here' })
  @IsUUID()
  store_id: string;

  @ApiPropertyOptional({ example: 'I am the owner of this store, here is my contact...' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}
