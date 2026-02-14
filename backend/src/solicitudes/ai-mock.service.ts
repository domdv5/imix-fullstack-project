import { Injectable } from '@nestjs/common';

/**
 * Simula una llamada a un servicio de IA.
 * En producción se reemplazaría por una integración real (OpenAI, etc.).
 */
@Injectable()
export class AiMockService {
  private readonly frases: string[] = [
    'El contenido que enviaste ("{{texto}}") ha sido procesado correctamente.',
    'Hemos analizado tu solicitud. El texto "{{texto}}" ha sido enriquecido.',
    'Procesamiento completado. Tu entrada "{{texto}}" se ha utilizado para generar este resultado.',
    'Resultado del análisis: se ha tenido en cuenta "{{texto}}" en la respuesta.',
    'Enriquecimiento aplicado. El contenido "{{texto}}" ha sido incorporado al resultado.',
  ];

  async enriquecer(texto: string): Promise<string> {
    await this.delay(800);
    const fragmento = texto.length > 60 ? texto.slice(0, 60).trim() + '…' : texto;
    const frase = this.frases[Math.floor(Math.random() * this.frases.length)];
    return frase.replace('{{texto}}', fragmento);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
