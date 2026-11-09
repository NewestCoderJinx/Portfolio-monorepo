import { IsBoolean, IsOptional } from 'class-validator';

/** Any combination of flags; omitted ones are left unchanged. */
export class UpdateMessageDto {
  @IsBoolean()
  @IsOptional()
  read?: boolean;

  @IsBoolean()
  @IsOptional()
  archived?: boolean;

  /** true records a reply now (keeping the first time if already set); false clears it. */
  @IsBoolean()
  @IsOptional()
  replied?: boolean;
}
