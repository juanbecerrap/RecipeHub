import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { Category, HealthStatus, Recipe, RecipeInput, RecipeSummary } from './models';
import { RecipesApi } from './recipes-api';

const category: Category = { id: 1, name: 'Desayunos', slug: 'desayunos' };

const summary: RecipeSummary = {
  id: 1,
  title: 'Pancakes esponjosos',
  description: 'Tortitas altas y suaves.',
  imagePath: 'pancakes.jpg',
  preparationTime: 20,
  difficulty: 'easy',
  servings: 4,
  category,
};

const recipe: Recipe = {
  ...summary,
  instructions: ['Mezcla los ingredientes secos.'],
  ingredients: [{ id: 1, name: 'Harina de trigo', quantity: 200, unit: 'g' }],
  createdAt: '2026-10-17T23:15:18.000Z',
  updatedAt: '2026-10-17T23:15:18.000Z',
};

const input: RecipeInput = {
  title: 'Pancakes esponjosos',
  description: 'Tortitas altas y suaves.',
  imagePath: 'pancakes.jpg',
  preparationTime: 20,
  difficulty: 'easy',
  servings: 4,
  categoryId: 1,
  instructions: ['Mezcla los ingredientes secos.'],
  ingredients: [{ name: 'Harina de trigo', quantity: 200, unit: 'g' }],
};

describe('RecipesApi', () => {
  const base = environment.apiUrl;
  let api: RecipesApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RecipesApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Falla si quedo alguna peticion sin atender
    http.verify();
  });

  it('consulta el estado del servicio y devuelve los datos sin el envoltorio', () => {
    const health: HealthStatus = { status: 'ok', database: 'ok', readOnly: false };
    let result: HealthStatus | undefined;

    api.getHealth().subscribe((value) => (result = value));

    const req = http.expectOne(`${base}/health`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, data: health });

    expect(result).toEqual(health);
  });

  it('obtiene las categorias', () => {
    let result: Category[] | undefined;

    api.getCategories().subscribe((value) => (result = value));

    const req = http.expectOne(`${base}/categories`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, data: [category] });

    expect(result).toEqual([category]);
  });

  it('lista las recetas sin enviar parametros cuando no hay filtros', () => {
    let result: RecipeSummary[] | undefined;

    api.getRecipes().subscribe((value) => (result = value));

    const req = http.expectOne((request) => request.url === `${base}/recipes`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ ok: true, data: [summary] });

    expect(result).toEqual([summary]);
  });

  it('envia los filtros y recorta el texto de busqueda', () => {
    api.getRecipes({ search: '  limon  ', category: 2, difficulty: 'medium' }).subscribe();

    const req = http.expectOne((request) => request.url === `${base}/recipes`);
    expect(req.request.params.get('search')).toBe('limon');
    expect(req.request.params.get('category')).toBe('2');
    expect(req.request.params.get('difficulty')).toBe('medium');
    req.flush({ ok: true, data: [] });
  });

  it('ignora los filtros vacios', () => {
    api.getRecipes({ search: '   ', category: null, difficulty: null }).subscribe();

    const req = http.expectOne((request) => request.url === `${base}/recipes`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ ok: true, data: [] });
  });

  it('obtiene el detalle de una receta', () => {
    let result: Recipe | undefined;

    api.getRecipe(9).subscribe((value) => (result = value));

    const req = http.expectOne(`${base}/recipes/9`);
    expect(req.request.method).toBe('GET');
    req.flush({ ok: true, data: recipe });

    expect(result).toEqual(recipe);
  });

  it('crea una receta enviando los datos tal cual', () => {
    let result: Recipe | undefined;

    api.createRecipe(input).subscribe((value) => (result = value));

    const req = http.expectOne(`${base}/recipes`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(input);
    req.flush({ ok: true, data: recipe });

    expect(result).toEqual(recipe);
  });

  it('edita una receta con PUT', () => {
    let result: Recipe | undefined;

    api.updateRecipe(9, input).subscribe((value) => (result = value));

    const req = http.expectOne(`${base}/recipes/9`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(input);
    req.flush({ ok: true, data: recipe });

    expect(result).toEqual(recipe);
  });

  it('elimina una receta con DELETE', () => {
    let completed = false;

    api.deleteRecipe(9).subscribe({ complete: () => (completed = true) });

    const req = http.expectOne(`${base}/recipes/9`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBe(true);
  });
});