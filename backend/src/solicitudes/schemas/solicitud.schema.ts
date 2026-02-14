import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SolicitudDocument = Solicitud & Document;

@Schema({ timestamps: true })
export class Solicitud {
  @Prop({ required: true })
  texto: string;

  @Prop({ required: true })
  textoEnriquecido: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SolicitudSchema = SchemaFactory.createForClass(Solicitud);
