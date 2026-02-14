import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./solicitud/solicitud.component').then((m) => m.SolicitudComponent) },
  { path: '**', redirectTo: '' },
];
