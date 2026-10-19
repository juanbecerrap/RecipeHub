import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from './app.routes';

describe('rutas', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(),
        provideHttpClientTesting(),
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