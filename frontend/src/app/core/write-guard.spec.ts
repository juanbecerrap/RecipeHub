import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { Observable, firstValueFrom, of } from 'rxjs';

import { Notices } from './notices';
import { AccessState, WriteAccess } from './write-access';
import { writeGuard } from './write-guard';

describe('writeGuard', () => {
  const run = async (state: AccessState) => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: WriteAccess, useValue: { check: () => of(state) } }],
    });

    const result = TestBed.runInInjectionContext(() =>
      writeGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
    return firstValueFrom(result as Observable<boolean | UrlTree>);
  };

  it('deja pasar cuando la API admite escrituras', async () => {
    expect(await run('writable')).toBe(true);
  });

  it('deja pasar cuando la API no responde, para que la pagina muestre su propio error', async () => {
    expect(await run('unavailable')).toBe(true);
  });

  it('redirige al catalogo con un aviso en la demostracion de solo lectura', async () => {
    const result = await run('readOnly');

    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/');
    expect(TestBed.inject(Notices).message()).toBe('Esta demostración es de solo lectura.');
  });
});