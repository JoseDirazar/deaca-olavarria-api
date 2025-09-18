import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EditProfileDto {
  @ApiProperty({ example: 'Jose', description: 'Nombre' })
  @IsString()
  @IsNotEmpty({ message: 'Introduce un nombre.' })
  @Length(3, undefined, {
    message: 'El nombre debe tener al menos 3 caracteres.',
  })
  first_name: string;

  @ApiProperty({ example: 'Agreda', description: 'Apellido' })
  @IsString()
  @IsNotEmpty({ message: 'Introduce un apellido.' })
  @Length(3, undefined, {
    message: 'El apellido debe tener al menos 3 caracteres.',
  })
  last_name: string;
}
