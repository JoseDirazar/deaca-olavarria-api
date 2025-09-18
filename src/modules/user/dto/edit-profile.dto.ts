import { IsNotEmpty, IsString, Length } from 'class-validator';

export class EditProfileDto {
  @IsString()
  @IsNotEmpty({ message: 'Introduce un nombre.' })
  @Length(3, undefined, {
    message: 'El nombre debe tener al menos 3 caracteres.',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: 'Introduce un apellido.' })
  @Length(3, undefined, {
    message: 'El apellido debe tener al menos 3 caracteres.',
  })
  lastName: string;
}
