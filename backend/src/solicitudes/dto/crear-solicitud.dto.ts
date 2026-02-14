import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CrearSolicitudDto {
  @IsString({ message: 'El texto deber ser un string' })
  @IsNotEmpty({ message: 'El texto es requerido' })
  @MaxLength(5000, {message: 'El texto debe ser menor o igual a 5000 caracteres'})
  texto: string;
}
