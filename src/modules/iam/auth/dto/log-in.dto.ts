import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class LogInDto {
  @IsEmail({}, { message: 'Correo electrónico no válido.' })
  @IsNotEmpty({ message: 'Introduce un Correo electrónico.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Introduce una Contraseña.' })
  @Length(6, 20, {
    message: 'La contraseña debe tener entre 6 y 20 caracteres.',
  })
  password: string;
}
