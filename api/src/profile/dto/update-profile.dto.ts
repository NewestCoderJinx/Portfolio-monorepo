import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

const URL_OPTS = { require_protocol: true };

// Every field is optional so the profile can be updated piece by piece.
// Send null to clear an optional field.
export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(150)
  @IsOptional()
  headline?: string | null;

  @IsString()
  @MaxLength(3000)
  @IsOptional()
  bio?: string | null;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  location?: string | null;

  @IsEmail()
  @IsOptional()
  email?: string | null;

  @IsUrl(URL_OPTS)
  @IsOptional()
  avatarUrl?: string | null;

  @IsUrl(URL_OPTS)
  @IsOptional()
  websiteUrl?: string | null;

  @IsUrl(URL_OPTS)
  @IsOptional()
  githubUrl?: string | null;

  @IsUrl(URL_OPTS)
  @IsOptional()
  linkedinUrl?: string | null;
}
