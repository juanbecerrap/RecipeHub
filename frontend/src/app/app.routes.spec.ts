import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

describe('rutas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  it('la raiz muestra el catalogo', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain('Recetas');
  });

  it('una ruta desconocida muestra la pagina de no encontrado', async () => {
    const harness = await RouterTestingHarness.create('/no-existe');
    expect(harness.routeNativeElement?.querySelector('h1')?.textContent).toContain(
      'No encontramos'
    );
  });
});