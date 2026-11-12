import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SLUG_MAX = 80;

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  /** Optional; generated from the title when left out. */
  @IsString()
  @MaxLength(SLUG_MAX)
  @Matches(SLUG_PATTERN, { message: 'slug may only contain lowercase letters, numbers and single hyphens' })
  @IsOptional()
  slug?: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  excerpt?: string | null;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  coverImageUrl?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[] | null;

  /** true publishes the post; false (the default) keeps it as a draft. */
  @IsBoolean()
  @IsOptional()
  published?: boolean;
}
