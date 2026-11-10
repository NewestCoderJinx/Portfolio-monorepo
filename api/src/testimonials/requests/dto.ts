import { IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { URL_OPTIONS } from '../../common/url-options';

export class CreateTestimonialRequestDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  recipientName?: string | null;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  note?: string | null;
}

/** What the person fills in on the public form. No avatar: uploads need a login. */
export class SubmitTestimonialDto {
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
  linkUrl?: string | null;

  /** Honeypot: hidden from people, so anything here came from a bot. */
  @IsString()
  @IsOptional()
  website?: string;
}
