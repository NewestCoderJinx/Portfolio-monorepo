import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { URL_OPTIONS } from '../../common/url-options';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  role?: string | null;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  company?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  quote: string;

  @IsUrl(URL_OPTIONS)
  @IsOptional()
  avatarUrl?: string | null;

  @IsUrl(URL_OPTIONS)
  @IsOptional()
  linkUrl?: string | null;

  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
