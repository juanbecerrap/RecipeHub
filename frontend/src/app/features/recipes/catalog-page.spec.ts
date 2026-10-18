import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { RecipeSummary } from '../../core/models';
import { RecipesApi } from '../../core/recipes-api';
import { CatalogPage } from './catalog-page';

const recipe = (id: number, title: string): RecipeSummary => ({
  id,
  title,
  description: 'Descripcion de prueba.',
  imagePath: 'foto.jpg',
  preparationTime: 20,
  difficulty: 'easy',
  servings: 4,
  category: { id: 1, name: 'Desayunos', slug: 'desayunos' },
});

describe('CatalogPage', () => {
  const setup = async (getRecipes: () => Observable<RecipeSummary[]>) => {
    TestBed.configureTestingModule({
      imports: [CatalogPage],
      providers: [provideRouter([]), { provide: RecipesApi, useValue: { getRecipes } }],
    });
    const fixture = TestBed.createComponent(CatalogPage);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  };

  it('muestra una tarjeta por receta y el total', async () => {
    const { element } = await setup(() => of([recipe(1, 'Pancakes'), recipe(2, 'Guacamole')]));

    expect(element.querySelectorAll('app-recipe-card').length).toBe(2);
    expect(element.querySelector('[role="status"]')?.textContent).toContain('2 recetas');
  });

  it('indica que esta cargando mientras espera la respuesta', async () => {
    const { element } = await setup(() => new Subject<RecipeSummary[]>());

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando recetas');
    expect(element.querySelectorAll('li.skeleton').length).toBe(6);
    expect(element.querySelectorAll('app-recipe-card').length).toBe(0);
  });

  it('muestra un mensaje cuando no hay recetas', async () => {
    const { element } = await setup(() => of([]));

    expect(element.textContent).toContain('Todavía no hay recetas');
  });

  it('muestra el error y permite reintentar', async () => {
    let calls = 0;
    const { fixture, element } = await setup(() => {
      calls += 1;
      return calls === 1
        ? throwError(() => new Error('sin conexion'))
        : of([recipe(1, 'Pancakes')]);
    });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar las recetas'
    );

    (element.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelectorAll('app-recipe-card').length).toBe(1);
    expect(calls).toBe(2);
  });
});