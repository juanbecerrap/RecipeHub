import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';

import { HealthStatus } from './models';
import { RecipesApi } from './recipes-api';
import { WriteAccess } from './write-access';

const health = (readOnly: boolean): HealthStatus => ({ status: 'ok', database: 'ok', readOnly });

describe('WriteAccess', () => {
  const create = (getHealth: () => Observable<HealthStatus>) => {
    TestBed.configureTestingModule({
      providers: [{ provide: RecipesApi, useValue: { getHealth } }],
    });
    return TestBed.inject(WriteAccess);
  };

  it('no permite escribir hasta recibir la respuesta de la API', () => {
    const response = new Subject<HealthStatus>();
    const access = create(() => response);

    access.load();
    expect(access.canWrite()).toBe(false);

    response.next(health(false));
    expect(access.canWrite()).toBe(true);
  });

  it('permite escribir cuando la API no es de solo lectura', () => {
    const access = create(() => of(health(false)));

    access.load();

    expect(access.canWrite()).toBe(true);
  });

  it('no permite escribir en la demostracion de solo lectura', () => {
    const access = create(() => of(health(true)));

    access.load();

    expect(access.canWrite()).toBe(false);
  });

  it('no permite escribir si la API no responde', () => {
    const access = create(() => throwError(() => new Error('sin conexion')));

    access.load();

    expect(access.canWrite()).toBe(false);
  });
});