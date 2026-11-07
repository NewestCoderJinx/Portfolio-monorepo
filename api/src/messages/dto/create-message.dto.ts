import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(200)
  email: string;

  @IsString()
  @MinLength(10, { message: 'message must be at least 10 characters' })
  @MaxLength(5000)
  body: string;

  /** Honeypot: hidden from people, so anything here came from a bot. */
  @IsString()
  @IsOptional()
  website?: string;
}
