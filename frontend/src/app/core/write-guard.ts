import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';

import { Notices } from './notices';
import { WriteAccess } from './write-access';

// Protege las rutas de escritura (crear y editar): solo bloquea cuando la API confirma
// que es de solo lectura. Si no responde, deja pasar y la pagina muestra su propio error.
export const writeGuard: CanActivateFn = () => {
  const router = inject(Router);
  const notices = inject(Notices);

  return inject(WriteAccess)
    .check()
    .pipe(
      map((state) => {
        if (state !== 'readOnly') {
          return true;
        }
        notices.show('Esta demostración es de solo lectura.');
        return router.parseUrl('/');
      })
    );
};