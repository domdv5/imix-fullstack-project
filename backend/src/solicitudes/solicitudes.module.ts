import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SolicitudSchema } from './schemas/solicitud.schema';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';
import { AiMockService } from './ai-mock.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Solicitud', schema: SolicitudSchema }]),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService, AiMockService],
})
export class SolicitudesModule {}
