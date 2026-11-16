import { IsString, Length, MaxLength, MinLength } from 'class-validator';

/** A 6-digit authenticator code, or a recovery code such as "k3m9p-x2c7w". */
export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 20)
  code: string;
}

export class TwoFactorLoginDto extends TwoFactorCodeDto {
  /** The challenge token returned by POST /auth/login when a code is needed. */
  @IsString()
  @MaxLength(2000)
  challenge: string;
}

export class DisableTwoFactorDto extends TwoFactorCodeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  password: string;
}
