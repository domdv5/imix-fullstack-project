import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SolicitudService, SolicitudRespuesta } from './solicitud.service';

type Estado = 'idle' | 'enviando' | 'ok' | 'error';

@Component({
  selector: 'app-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud.component.html',
})
export class SolicitudComponent implements OnInit {
  texto = '';
  estado: Estado = 'idle';
  error: string | null = null;
  respuesta: SolicitudRespuesta | null = null;

  historial: SolicitudRespuesta[] = [];
  selectedId: string | null = null;
  solicitudSeleccionada: SolicitudRespuesta | null = null;
  loadingHistorial = false;
  loadingDetalle = false;
  sidebarAbierto = true;

  /** Un solo detalle visible: respuesta recién enviada o ítem seleccionado del historial */
  get detalleActual(): SolicitudRespuesta | null {
    if (this.solicitudSeleccionada) return this.solicitudSeleccionada;
    if (this.respuesta) return this.respuesta;
    return null;
  }

  constructor(private solicitudService: SolicitudService) {}

  ngOnInit(): void {
    this.cargarHistorial();
  }

  cargarHistorial(): void {
    this.loadingHistorial = true;
    this.solicitudService.listar().subscribe({
      next: (list) => {
        this.historial = list;
        this.loadingHistorial = false;
      },
      error: () => {
        this.loadingHistorial = false;
      },
    });
  }

  toggleSidebar(): void {
    this.sidebarAbierto = !this.sidebarAbierto;
  }

  seleccionarSolicitud(id: string): void {
    if (this.selectedId === id) return;
    this.selectedId = id;
    this.solicitudSeleccionada = null;
    this.loadingDetalle = true;
    this.solicitudService.obtenerPorId(id).subscribe({
      next: (s) => {
        this.solicitudSeleccionada = s;
        this.loadingDetalle = false;
      },
      error: () => {
        this.loadingDetalle = false;
      },
    });
  }

  formatearFecha(createdAt: string): string {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  truncar(texto: string, max: number): string {
    if (!texto) return '';
    return texto.length <= max ? texto : texto.slice(0, max).trim() + '…';
  }

  enviar(): void {
    const texto = this.texto?.trim();
    if (!texto) return;

    this.estado = 'enviando';
    this.error = null;
    this.respuesta = null;

    this.solicitudService.enviar({ texto }).subscribe({
      next: (data) => {
        this.estado = 'ok';
        this.respuesta = data;
        this.selectedId = data.id;
        this.solicitudSeleccionada = data;
        this.texto = '';
        this.cargarHistorial();
      },
      error: (err) => {
        this.estado = 'error';
        const msg = err?.error?.message;
        this.error = Array.isArray(msg) ? msg.join(' ') : msg || err?.message || 'Error al procesar la solicitud';
      },
    });
  }
}
