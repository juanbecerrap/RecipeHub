import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import { Category, Recipe, RecipeInput } from '../../core/models';
import { Notices } from '../../core/notices';
import { RecipesApi } from '../../core/recipes-api';
import { RecipeFormPage } from './recipe-form-page';

@Component({ selector: 'app-blank-page', template: '' })
class BlankPage {}

const categories: Category[] = [
  { id: 1, name: 'Desayunos', slug: 'desayunos' },
  { id: 2, name: 'Postres', slug: 'postres' },
];

const created: Recipe = {
  id: 7,
  title: 'Tortilla de patatas',
  description: 'La tortilla de siempre, jugosa por dentro.',
  imagePath: 'default.jpg',
  preparationTime: 45,
  difficulty: 'medium',
  servings: 4,
  category: { id: 2, name: 'Postres', slug: 'postres' },
  instructions: ['Pela las patatas y cortalas.'],
  ingredients: [{ id: 1, name: 'Patatas', quantity: 500, unit: 'g' }],
  createdAt: '2026-10-18T10:00:00.000Z',
  updatedAt: '2026-10-18T10:00:00.000Z',
};

type CreateRecipe = (input: RecipeInput) => Observable<Recipe>;

interface SetupOptions {
  createRecipe?: CreateRecipe;
  getCategories?: () => Observable<Category[]>;
}

const unprocessable = (details: { field: string; message: string }[]) =>
  new HttpErrorResponse({
    status: 422,
    error: { ok: false, error: { message: 'Los datos de la receta no son validos', details } },
  });

describe('RecipeFormPage', () => {
  const setup = async (options: SetupOptions = {}) => {
    const createRecipe = vi.fn<CreateRecipe>(options.createRecipe ?? (() => of(created)));
    const getCategories = options.getCategories ?? (() => of(categories));

    TestBed.configureTestingModule({
      imports: [RecipeFormPage],
      providers: [
        provideRouter([
          { path: '', component: BlankPage },
          { path: 'recetas/:id', component: BlankPage },
        ]),
        { provide: RecipesApi, useValue: { getCategories, createRecipe } },
      ],
    });

    const fixture = TestBed.createComponent(RecipeFormPage);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    const find = <T extends HTMLElement>(selector: string) => element.querySelector(selector) as T;

    const type = (selector: string, value: string) => {
      const control = find<HTMLInputElement | HTMLTextAreaElement>(selector);
      control.value = value;
      control.dispatchEvent(new Event('input'));
    };

    const choose = (selector: string, index: number) => {
      const control = find<HTMLSelectElement>(selector);
      control.selectedIndex = index;
      control.dispatchEvent(new Event('change'));
    };

    const fillValidForm = async () => {
      type('#recipe-title', '  Tortilla de patatas  ');
      type('#recipe-description', 'La tortilla de siempre, jugosa por dentro.');
      choose('#recipe-category', 2);
      choose('#recipe-difficulty', 2);
      type('#recipe-time', '45');
      type('#recipe-servings', '4');
      type('#ingredient-name-0', 'Patatas');
      type('#ingredient-quantity-0', '500');
      type('#ingredient-unit-0', 'g');
      type('#step-0', 'Pela las patatas y cortalas.');
      await fixture.whenStable();
    };

    const submit = async () => {
      find<HTMLButtonElement>('button[type="submit"]').click();
      await fixture.whenStable();
    };

    return { fixture, element, createRecipe, find, choose, fillValidForm, submit };
  };

  it('muestra el formulario con una fila de ingrediente y un paso', async () => {
    const { element } = await setup();

    expect(element.querySelector('h1')?.textContent).toContain('Nueva receta');
    expect(element.querySelectorAll('.ingredient-row').length).toBe(1);
    expect(element.querySelectorAll('.step-row').length).toBe(1);
  });

  it('ofrece las categorias de la API', async () => {
    const { element } = await setup();

    const options = element.querySelectorAll('#recipe-category option');
    expect(options.length).toBe(3);
    expect(options[2].textContent).toContain('Postres');
  });

  it('permite reintentar la carga de categorias', async () => {
    let calls = 0;
    const { fixture, element, find } = await setup({
      getCategories: () => {
        calls += 1;
        return calls === 1 ? throwError(() => new Error('sin conexion')) : of(categories);
      },
    });
    expect(element.textContent).toContain('No pudimos cargar las categorías');

    find<HTMLButtonElement>('.link-button').click();
    await fixture.whenStable();

    expect(element.querySelectorAll('#recipe-category option').length).toBe(3);
    expect(element.textContent).not.toContain('No pudimos cargar las categorías');
  });

  it('no envia el formulario vacio, muestra los errores y enfoca el primer campo', async () => {
    const { element, createRecipe, submit } = await setup();

    await submit();

    expect(createRecipe).not.toHaveBeenCalled();
    expect(element.querySelector('#recipe-title-error')?.textContent).toContain('obligatorio');
    expect(element.querySelector('#recipe-category-error')?.textContent).toContain('obligatorio');
    expect(element.querySelector('[role="alert"]')?.textContent).toContain('Revisa los campos');
    expect(document.activeElement?.id).toBe('recipe-title');
  });

  it('añade y quita ingredientes y pasos moviendo el foco', async () => {
    const { fixture, element, find } = await setup();

    find<HTMLButtonElement>('#add-ingredient').click();
    await fixture.whenStable();
    expect(element.querySelectorAll('.ingredient-row').length).toBe(2);
    expect(document.activeElement?.id).toBe('ingredient-name-1');

    find<HTMLButtonElement>('.ingredient-row .row__remove').click();
    await fixture.whenStable();
    expect(element.querySelectorAll('.ingredient-row').length).toBe(1);
    expect(find<HTMLButtonElement>('.ingredient-row .row__remove').disabled).toBe(true);
    expect(document.activeElement?.id).toBe('add-ingredient');

    find<HTMLButtonElement>('#add-step').click();
    await fixture.whenStable();
    expect(element.querySelectorAll('.step-row').length).toBe(2);
    expect(document.activeElement?.id).toBe('step-1');
  });

  it('envia los datos limpios, avisa y abre la receta', async () => {
    const { fixture, createRecipe, fillValidForm, submit } = await setup();

    await fillValidForm();
    await submit();

    expect(createRecipe).toHaveBeenCalledWith({
      title: 'Tortilla de patatas',
      description: 'La tortilla de siempre, jugosa por dentro.',
      preparationTime: 45,
      difficulty: 'medium',
      servings: 4,
      categoryId: 2,
      instructions: ['Pela las patatas y cortalas.'],
      ingredients: [{ name: 'Patatas', quantity: 500, unit: 'g' }],
    });
    expect(TestBed.inject(Notices).message()).toBe('Receta guardada');
    expect(TestBed.inject(Router).url).toBe('/recetas/7');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('envia la foto elegida', async () => {
    const { createRecipe, choose, fillValidForm, submit } = await setup();

    await fillValidForm();
    choose('#recipe-photo', 1);
    await submit();

    expect(createRecipe.mock.calls[0][0].imagePath).toBe('pancakes.jpg');
  });

  it('coloca los errores del servidor junto a cada campo', async () => {
    const { element, fillValidForm, submit } = await setup({
      createRecipe: () =>
        throwError(() =>
          unprocessable([
            { field: 'categoryId', message: 'La categoria no existe' },
            { field: 'ingredients[0].name', message: 'Ingrediente repetido en la receta' },
          ])
        ),
    });

    await fillValidForm();
    await submit();

    expect(element.querySelector('#recipe-category-error')?.textContent).toContain(
      'La categoría no existe'
    );
    expect(element.querySelector('#ingredient-name-0-error')?.textContent).toContain(
      'ya está en la receta'
    );
    expect(TestBed.inject(Notices).message()).toBeNull();
  });

  it('avisa cuando la demostracion es de solo lectura', async () => {
    const { element, fillValidForm, submit } = await setup({
      createRecipe: () => throwError(() => new HttpErrorResponse({ status: 403 })),
    });

    await fillValidForm();
    await submit();

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'Esta demostración es de solo lectura'
    );
  });

  it('no envia dos veces mientras guarda', async () => {
    const { element, createRecipe, fillValidForm, submit } = await setup({
      createRecipe: () => new Subject<Recipe>(),
    });

    await fillValidForm();
    await submit();
    await submit();

    const button = element.querySelector('button[type="submit"]') as HTMLButtonElement;
    expect(createRecipe).toHaveBeenCalledTimes(1);
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Guardando');
  });
});