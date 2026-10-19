import { Injectable, inject, signal } from '@angular/core';
import { catchError, map, of } from 'rxjs';

import { RecipesApi } from './recipes-api';

// Indica si la API admite escrituras (crear, editar y eliminar).
// En la demostracion publica la API es de solo lectura y los botones no se muestran.
@Injectable({ providedIn: 'root' })
export class WriteAccess {
  private readonly api = inject(RecipesApi);
  private readonly writable = signal(false);

  // Falso hasta que la API confirme que admite escrituras
  readonly canWrite = this.writable.asReadonly();

  load(): void {
    this.api
      .getHealth()
      .pipe(
        map((health) => !health.readOnly),
        catchError(() => of(false))
      )
      .subscribe((value) => this.writable.set(value));
  }
}