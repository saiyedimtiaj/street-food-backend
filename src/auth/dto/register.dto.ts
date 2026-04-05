import {
  IsEmail,
  IsIn,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'Password1',
    description: 'Min 8 chars, at least one uppercase letter and one number',
  })
  @IsString()
  @MinLength(8)
  @Matches(/(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter and one number',
  })
  password: string;

  @ApiProperty({ enum: ['user', 'store'], example: 'user' })
  @IsIn(['user', 'store'], { message: 'Role must be either "user" or "store"' })
  role: string;
}
