import { IsUUID } from 'class-validator';

export class UUIDParamDto {
  @IsUUID('all')
  id: string;
}
