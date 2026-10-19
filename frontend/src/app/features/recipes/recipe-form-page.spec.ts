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

// Receta que se edita en las pruebas de edicion
const existing: Recipe = {
  ...created,
  imagePath: 'tortilla-patatas.jpg',
  instructions: ['Pela las patatas.', 'Frie las patatas y la cebolla.'],
  ingredients: [
    { id: 1, name: 'Patatas', quantity: 500, unit: 'g' },
    { id: 2, name: 'Huevos', quantity: 5, unit: '' },
  ],
};

type CreateRecipe = (input: RecipeInput) => Observable<Recipe>;
type UpdateRecipe = (id: number, input: RecipeInput) => Observable<Recipe>;
type GetRecipe = (id: number) => Observable<Recipe>;

interface SetupOptions {
  id?: string;
  createRecipe?: CreateRecipe;
  updateRecipe?: UpdateRecipe;
  getRecipe?: GetRecipe;
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
    const updateRecipe = vi.fn<UpdateRecipe>(options.updateRecipe ?? (() => of(existing)));
    const getRecipe = vi.fn<GetRecipe>(options.getRecipe ?? (() => of(existing)));
    const getCategories = options.getCategories ?? (() => of(categories));

    TestBed.configureTestingModule({
      imports: [RecipeFormPage],
      providers: [
        provideRouter([
          { path: '', component: BlankPage },
          { path: 'recetas/:id', component: BlankPage },
        ]),
        { provide: RecipesApi, useValue: { getCategories, createRecipe, updateRecipe, getRecipe } },
      ],
    });

    const fixture = TestBed.createComponent(RecipeFormPage);
    if (options.id !== undefined) {
      fixture.componentRef.setInput('id', options.id);
    }
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

    return {
      fixture,
      element,
      createRecipe,
      updateRecipe,
      getRecipe,
      find,
      type,
      choose,
      fillValidForm,
      submit,
    };
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

  describe('edicion', () => {
    it('carga la receta y rellena el formulario', async () => {
      const { element, getRecipe, find } = await setup({ id: '7' });

      expect(getRecipe).toHaveBeenCalledWith(7);
      expect(element.querySelector('h1')?.textContent).toContain('Editar receta');
      expect(find<HTMLInputElement>('#recipe-title').value).toBe('Tortilla de patatas');
      expect(find<HTMLInputElement>('#recipe-time').value).toBe('45');
      expect(find<HTMLSelectElement>('#recipe-category').selectedOptions[0].textContent).toContain(
        'Postres'
      );
      expect(element.querySelectorAll('.ingredient-row').length).toBe(2);
      expect(element.querySelectorAll('.step-row').length).toBe(2);
      expect(find<HTMLButtonElement>('button[type="submit"]').textContent).toContain(
        'Guardar cambios'
      );
    });

    it('guarda los cambios con la edicion, avisa y vuelve a la receta', async () => {
      const { createRecipe, updateRecipe, type, submit } = await setup({ id: '7' });

      type('#recipe-title', 'Tortilla con cebolla');
      await submit();

      expect(createRecipe).not.toHaveBeenCalled();
      expect(updateRecipe).toHaveBeenCalledTimes(1);
      const [id, input] = updateRecipe.mock.calls[0];
      expect(id).toBe(7);
      expect(input.title).toBe('Tortilla con cebolla');
      expect(input.ingredients.length).toBe(2);
      expect(TestBed.inject(Notices).message()).toBe('Cambios guardados');
      expect(TestBed.inject(Router).url).toBe('/recetas/7');
    });

    it('avisa cuando la receta que se edita no existe', async () => {
      const { element } = await setup({
        id: '7',
        getRecipe: () => throwError(() => new HttpErrorResponse({ status: 404 })),
      });

      expect(element.querySelector('h1')?.textContent).toContain('No encontramos esa receta');
      expect(element.querySelector('form')).toBeNull();
    });

    it('no consulta la API si el identificador no es valido', async () => {
      const { element, getRecipe } = await setup({ id: 'abc' });

      expect(getRecipe).not.toHaveBeenCalled();
      expect(element.querySelector('h1')?.textContent).toContain('No encontramos esa receta');
    });

    it('muestra el error de carga y permite reintentar', async () => {
      let calls = 0;
      const { fixture, element } = await setup({
        id: '7',
        getRecipe: () => {
          calls += 1;
          return calls === 1
            ? throwError(() => new HttpErrorResponse({ status: 500 }))
            : of(existing);
        },
      });
      expect(element.querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos cargar la receta'
      );

      (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(element.querySelector('h1')?.textContent).toContain('Editar receta');
      expect(calls).toBe(2);
    });

    it('conserva la foto actual aunque no este en la lista', async () => {
      const { element, updateRecipe, submit } = await setup({
        id: '7',
        getRecipe: () => of({ ...existing, imagePath: 'tostadas-aguacate.jpg' }),
      });

      const values = Array.from(element.querySelectorAll<HTMLOptionElement>('#recipe-photo option')).map(
        (option) => option.value
      );
      expect(values).toContain('tostadas-aguacate.jpg');

      await submit();

      expect(updateRecipe.mock.calls[0][1].imagePath).toBe('tostadas-aguacate.jpg');
    });

    it('no envia foto cuando la receta usa la foto por defecto', async () => {
      const { updateRecipe, submit } = await setup({
        id: '7',
        getRecipe: () => of({ ...existing, imagePath: 'default.jpg' }),
      });

      await submit();

      expect('imagePath' in updateRecipe.mock.calls[0][1]).toBe(false);
    });
  });
});