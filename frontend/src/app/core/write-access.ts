import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';

import { RecipesApi } from './recipes-api';

// 'unknown' hasta recibir la respuesta de la API; despues uno de los otros tres
export type AccessState = 'unknown' | 'writable' | 'readOnly' | 'unavailable';

// Indica si la API admite escrituras (crear, editar y eliminar).
// En la demostracion publica la API es de solo lectura y los botones no se muestran.
@Injectable({ providedIn: 'root' })
export class WriteAccess {
  private readonly api = inject(RecipesApi);
  private readonly current = signal<AccessState>('unknown');
  private request: Observable<AccessState> | null = null;

  readonly state = this.current.asReadonly();

  // Falso hasta que la API confirme que admite escrituras
  readonly canWrite = computed(() => this.current() === 'writable');

  load(): void {
    this.check().subscribe();
  }

  // Devuelve el estado cuando se conoce. Consulta la API una sola vez: todas las
  // llamadas comparten la misma peticion.
  check(): Observable<AccessState> {
    this.request ??= this.api.getHealth().pipe(
      map((health): AccessState => (health.readOnly ? 'readOnly' : 'writable')),
      catchError(() => of<AccessState>('unavailable')),
      tap((state) => this.current.set(state)),
      shareReplay(1)
    );
    return this.request;
  }
}