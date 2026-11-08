import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { URL_OPTIONS } from '../../common/url-options';
import { CREDENTIAL_KINDS, type CredentialKind } from '../credential.entity';

export class CreateCredentialDto {
  @IsIn(CREDENTIAL_KINDS)
  kind: CredentialKind;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  institution: string;

  @IsDateString({ strict: true })
  @IsOptional()
  startDate?: string | null;

  @IsDateString({ strict: true })
  @IsOptional()
  endDate?: string | null;

  @IsUrl(URL_OPTIONS)
  @IsOptional()
  credentialUrl?: string | null;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  description?: string | null;
}
