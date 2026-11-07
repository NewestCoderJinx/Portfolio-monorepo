import { IsBoolean } from 'class-validator';

export class UpdateMessageDto {
  @IsBoolean()
  read: boolean;
}
