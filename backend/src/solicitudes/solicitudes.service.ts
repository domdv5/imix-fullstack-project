import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { SolicitudDocument } from "./schemas/solicitud.schema";
import { CrearSolicitudDto } from "./dto/crear-solicitud.dto";
import { AiMockService } from "./ai-mock.service";

@Injectable()
export class SolicitudesService {
  private readonly logger = new Logger(SolicitudesService.name);

  constructor(
    @InjectModel("Solicitud") private solicitudModel: Model<SolicitudDocument>,
    private aiMockService: AiMockService,
  ) {}

  async procesar(dto: CrearSolicitudDto) {
    try {
      const textoEnriquecido = await this.aiMockService.enriquecer(dto.texto);
      const solicitud = new this.solicitudModel({
        texto: dto.texto,
        textoEnriquecido,
      });
      await solicitud.save();
      return {
        id: solicitud._id.toString(),
        texto: solicitud.texto,
        textoEnriquecido: solicitud.textoEnriquecido,
        createdAt: solicitud.get("createdAt"),
      };
    } catch (error) {
      this.logger.error("Error al procesar solicitud (BD/AI):", error);
      throw new HttpException(
        "Servicio temporalmente no disponible. Intente más tarde.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async findAll() {
    try {
      const list = await this.solicitudModel
        .find()
        .sort({ createdAt: -1 })
        .lean();
      return list.map((solicitud) => ({
        id: solicitud._id.toString(),
        texto: solicitud.texto,
        textoEnriquecido: solicitud.textoEnriquecido,
        createdAt: solicitud.createdAt,
      }));
    } catch (error) {
      this.logger.error("Error al listar solicitudes (BD):", error);
      throw new HttpException(
        "Servicio temporalmente no disponible. Intente más tarde.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async findOne(id: string) {
    try {
      const solicitud = await this.solicitudModel.findById(id).lean();
      if (!solicitud) throw new NotFoundException("Solicitud no encontrada");
      return {
        id: solicitud._id.toString(),
        texto: solicitud.texto,
        textoEnriquecido: solicitud.textoEnriquecido,
        createdAt: solicitud.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Error al obtener solicitud ${id} (BD):`, error);
      throw new HttpException(
        "Servicio temporalmente no disponible. Intente más tarde.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
