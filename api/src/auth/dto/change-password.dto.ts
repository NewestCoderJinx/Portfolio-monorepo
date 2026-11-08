import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  currentPassword: string;

  /** bcrypt only uses the first 72 bytes, so longer passwords are refused rather than silently cut. */
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
