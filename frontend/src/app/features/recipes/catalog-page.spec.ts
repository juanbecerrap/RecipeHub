import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { Category, RecipeFilters, RecipeSummary } from '../../core/models';
import { RecipesApi } from '../../core/recipes-api';
import { CatalogPage } from './catalog-page';

type GetRecipes = (filters?: RecipeFilters) => Observable<RecipeSummary[]>;

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

const categories: Category[] = [
  { id: 1, name: 'Desayunos', slug: 'desayunos' },
  { id: 2, name: 'Postres', slug: 'postres' },
];

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

describe('CatalogPage', () => {
  const setup = async (implementation: GetRecipes, categoryList: Category[] = categories) => {
    const getRecipes = vi.fn<GetRecipes>(implementation);

    TestBed.configureTestingModule({
      imports: [CatalogPage],
      providers: [
        provideRouter([]),
        { provide: RecipesApi, useValue: { getRecipes, getCategories: () => of(categoryList) } },
      ],
    });

    const fixture = TestBed.createComponent(CatalogPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const choose = async (selector: string, value: string) => {
      const select = element.querySelector(selector) as HTMLSelectElement;
      select.value = value;
      select.dispatchEvent(new Event('change'));
      await fixture.whenStable();
    };

    return { fixture, element, getRecipes, choose };
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

  it('muestra un mensaje cuando todavia no hay recetas', async () => {
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

    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelectorAll('app-recipe-card').length).toBe(1);
    expect(calls).toBe(2);
  });

  it('ofrece las categorias en el filtro', async () => {
    const { element } = await setup(() => of([]));

    const options = element.querySelectorAll('#filter-category option');
    expect(options.length).toBe(3);
    expect(options[0].textContent).toContain('Todas');
    expect(options[2].textContent).toContain('Postres');
  });

  it('filtra por categoria y dificultad al momento', async () => {
    const { getRecipes, choose } = await setup(() => of([recipe(1, 'Pancakes')]));

    await choose('#filter-category', '2');
    expect(getRecipes.mock.lastCall?.[0]).toEqual({ search: '', category: 2, difficulty: null });

    await choose('#filter-difficulty', 'hard');
    expect(getRecipes.mock.lastCall?.[0]).toEqual({ search: '', category: 2, difficulty: 'hard' });
  });

  it('espera una pausa antes de buscar por texto', async () => {
    const { fixture, element, getRecipes } = await setup(() => of([recipe(1, 'Pancakes')]));
    expect(getRecipes).toHaveBeenCalledTimes(1);

    const input = element.querySelector('#filter-search') as HTMLInputElement;
    input.value = 'limon';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    // Aun no ha pasado la pausa
    expect(getRecipes).toHaveBeenCalledTimes(1);

    await wait(450);
    await fixture.whenStable();

    expect(getRecipes).toHaveBeenCalledTimes(2);
    expect(getRecipes.mock.lastCall?.[0]).toEqual({ search: 'limon', category: null, difficulty: null });
  });

  it('muestra un aviso cuando los filtros no coinciden con ninguna receta', async () => {
    const { element, choose } = await setup((filters) =>
      of(filters?.category ? [] : [recipe(1, 'Pancakes')])
    );

    await choose('#filter-category', '2');

    expect(element.textContent).toContain('No encontramos recetas con esos filtros');
    expect(element.querySelector('[role="status"]')?.textContent).toContain('Sin resultados');
  });

  it('limpia los filtros y devuelve el foco al buscador', async () => {
    const { fixture, element, getRecipes, choose } = await setup(() => of([recipe(1, 'Pancakes')]));
    const clear = element.querySelector('.filters__clear') as HTMLButtonElement;
    expect(clear.disabled).toBe(true);

    await choose('#filter-category', '2');
    expect(clear.disabled).toBe(false);

    clear.click();
    await fixture.whenStable();

    expect(getRecipes.mock.lastCall?.[0]).toEqual({ search: '', category: null, difficulty: null });
    expect(clear.disabled).toBe(true);
    expect(document.activeElement).toBe(element.querySelector('#filter-search'));
  });
});