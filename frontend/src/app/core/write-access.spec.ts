import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { HealthStatus } from './models';
import { RecipesApi } from './recipes-api';
import { WriteAccess } from './write-access';

const health = (readOnly: boolean): HealthStatus => ({ status: 'ok', database: 'ok', readOnly });

describe('WriteAccess', () => {
  const create = (implementation: () => Observable<HealthStatus>) => {
    const getHealth = vi.fn(implementation);
    TestBed.configureTestingModule({
      providers: [{ provide: RecipesApi, useValue: { getHealth } }],
    });
    return { access: TestBed.inject(WriteAccess), getHealth };
  };

  it('no permite escribir hasta recibir la respuesta de la API', () => {
    const response = new Subject<HealthStatus>();
    const { access } = create(() => response);

    access.load();
    expect(access.canWrite()).toBe(false);
    expect(access.state()).toBe('unknown');

    response.next(health(false));
    expect(access.canWrite()).toBe(true);
    expect(access.state()).toBe('writable');
  });

  it('permite escribir cuando la API no es de solo lectura', () => {
    const { access } = create(() => of(health(false)));

    access.load();

    expect(access.canWrite()).toBe(true);
  });

  it('no permite escribir en la demostracion de solo lectura', () => {
    const { access } = create(() => of(health(true)));

    access.load();

    expect(access.canWrite()).toBe(false);
    expect(access.state()).toBe('readOnly');
  });

  it('no permite escribir si la API no responde y lo distingue del solo lectura', () => {
    const { access } = create(() => throwError(() => new Error('sin conexion')));

    access.load();

    expect(access.canWrite()).toBe(false);
    expect(access.state()).toBe('unavailable');
  });

  it('consulta la API una sola vez aunque se pregunte varias veces', () => {
    const { access, getHealth } = create(() => of(health(false)));
    let result: string | undefined;

    access.load();
    access.check().subscribe((state) => (result = state));
    access.check().subscribe();

    expect(result).toBe('writable');
    expect(getHealth).toHaveBeenCalledTimes(1);
  });
});