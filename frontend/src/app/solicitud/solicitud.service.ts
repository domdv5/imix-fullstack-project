import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

const API = `${environment.apiUrl}/solicitudes`;

export interface CrearSolicitudBody {
  texto: string;
}

export interface SolicitudRespuesta {
  id: string;
  texto: string;
  textoEnriquecido: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  constructor(private http: HttpClient) {}

  enviar(body: CrearSolicitudBody): Observable<SolicitudRespuesta> {
    return this.http.post<SolicitudRespuesta>(API, body);
  }

  listar(): Observable<SolicitudRespuesta[]> {
    return this.http.get<SolicitudRespuesta[]>(API);
  }

  obtenerPorId(id: string): Observable<SolicitudRespuesta> {
    return this.http.get<SolicitudRespuesta>(`${API}/${id}`);
  }
}
