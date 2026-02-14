import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';

@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  async procesar(@Body() dto: CrearSolicitudDto) {
    return this.solicitudesService.procesar(dto);
  }

  @Get()
  async listar() {
    return this.solicitudesService.findAll();
  }

  @Get(':id')
  async obtener(@Param('id') id: string) {
    return this.solicitudesService.findOne(id);
  }
}
