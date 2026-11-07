import { ArrayMaxSize, IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { URL_OPTIONS } from '../../common/url-options';

export const GALLERY_MAX = 8;

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  problem?: string;

  @IsString()
  @IsOptional()
  solution?: string;

  @IsString()
  @IsOptional()
  challenges?: string;

  @IsString()
  @IsOptional()
  decisions?: string;

  @IsString()
  @IsOptional()
  lessonsLearned?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  githubUrl?: string;

  @IsString()
  @IsOptional()
  demoUrl?: string;

  @IsBoolean()
  @IsOptional()
  featured?: boolean;

  @IsArray()
  @ArrayMaxSize(GALLERY_MAX)
  @IsUrl(URL_OPTIONS, { each: true })
  @IsOptional()
  gallery?: string[] | null;
}
