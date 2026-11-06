import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateExperienceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  role: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  company: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  location?: string | null;

  @IsDateString({ strict: true })
  startDate: string;

  /** Omit or send null for a current role. */
  @IsDateString({ strict: true })
  @IsOptional()
  endDate?: string | null;

  @IsString()
  @MaxLength(3000)
  @IsOptional()
  description?: string | null;

  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  @IsOptional()
  skills?: string[] | null;
}
