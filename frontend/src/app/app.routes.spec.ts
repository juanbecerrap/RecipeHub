import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';

import { routes } from './app.routes';
import { Notices } from './core/notices';
import { AccessState, WriteAccess } from './core/write-access';

describe('rutas', () => {
  // Lo que responde la API segun la prueba (se lee al comprobar el acceso)
  let access: AccessState;

  beforeEach(() => {
    access = 'writable';

    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: WriteAccess,
          useValue: { check: () => of(access), canWrite: signal(false) },
        },
      ],
    });
  });

  it('la raiz muestra el catalogo', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Recetas');
  });

  it('la ruta de nueva receta muestra el formulario y no el detalle', async () => {
    const harness = await RouterTestingHarness.create('/recetas/nueva');
    expect(harness.routeNativeElement?.localName).toBe('app-recipe-form-page');
  });

  it('la ruta de edicion muestra el formulario', async () => {
    const harness = await RouterTestingHarness.create('/recetas/7/editar');
    expect(harness.routeNativeElement?.localName).toBe('app-recipe-form-page');
  });

  it('en la demostracion de solo lectura las rutas de escritura llevan al catalogo con un aviso', async () => {
    access = 'readOnly';

    const harness = await RouterTestingHarness.create('/recetas/nueva');

    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Recetas');
    expect(TestBed.inject(Notices).message()).toBe('Esta demostración es de solo lectura.');
  });

  it('la ruta de una receta muestra la pagina de detalle', async () => {
    const harness = await RouterTestingHarness.create('/recetas/7');
    expect(harness.routeNativeElement?.localName).toBe('app-recipe-detail-page');
  });

  it('una ruta desconocida muestra la pagina de no encontrado', async () => {
    const harness = await RouterTestingHarness.create('/no-existe');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'No encontramos'
    );
  });
});