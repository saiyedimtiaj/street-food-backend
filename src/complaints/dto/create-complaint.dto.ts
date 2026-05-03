import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateComplaintDto {
  @ApiProperty({ example: 'uuid-of-store' })
  @IsUUID()
  store_id: string;

  @ApiProperty({ example: 'Food quality issue' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  subject: string;

  @ApiProperty({ example: 'Detailed description of the complaint...' })
  @IsString()
  @MinLength(10)
  description: string;
}
