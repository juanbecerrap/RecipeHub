import { HttpErrorResponse } from '@angular/common/http';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { Observable, Subject, of, throwError } from 'rxjs';

import '../../../testing/dialog-polyfill';
import { Recipe } from '../../core/models';
import { Notices } from '../../core/notices';
import { RecipesApi } from '../../core/recipes-api';
import { WriteAccess } from '../../core/write-access';
import { RecipeDetailPage } from './recipe-detail-page';

@Component({ selector: 'app-blank-page', template: '' })
class BlankPage {}

const recipe: Recipe = {
  id: 7,
  title: 'Pancakes esponjosos',
  description: 'Tortitas altas y suaves.',
  imagePath: 'pancakes.jpg',
  preparationTime: 20,
  difficulty: 'easy',
  servings: 4,
  category: { id: 1, name: 'Desayunos', slug: 'desayunos' },
  instructions: [
    'Mezcla los ingredientes secos.',
    'Bate los huevos con la leche.',
    'Cocina en una sarten caliente.',
  ],
  ingredients: [
    { id: 1, name: 'Harina de trigo', quantity: 200, unit: 'g' },
    { id: 2, name: 'Leche', quantity: 250.5, unit: 'ml' },
    { id: 3, name: 'Huevos', quantity: 2, unit: '' },
  ],
  createdAt: '2026-10-17T23:15:18.000Z',
  updatedAt: '2026-10-17T23:15:18.000Z',
};

type GetRecipe = (id: number) => Observable<Recipe>;
type DeleteRecipe = (id: number) => Observable<void>;

interface SetupOptions {
  id?: string;
  canWrite?: boolean;
  deleteRecipe?: DeleteRecipe;
}

describe('RecipeDetailPage', () => {
  const setup = async (implementation: GetRecipe, options: SetupOptions = {}) => {
    const { id = '7', canWrite = false, deleteRecipe = () => of(undefined) } = options;
    const getRecipe = vi.fn<GetRecipe>(implementation);
    const removeRecipe = vi.fn<DeleteRecipe>(deleteRecipe);

    TestBed.configureTestingModule({
      imports: [RecipeDetailPage],
      providers: [
        provideRouter([{ path: '', component: BlankPage }]),
        { provide: RecipesApi, useValue: { getRecipe, deleteRecipe: removeRecipe } },
        { provide: WriteAccess, useValue: { canWrite: signal(canWrite) } },
      ],
    });

    const fixture = TestBed.createComponent(RecipeDetailPage);
    fixture.componentRef.setInput('id', id);
    await fixture.whenStable();

    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      getRecipe,
      removeRecipe,
    };
  };

  it('muestra los datos de la receta, los ingredientes y los pasos', async () => {
    const { element } = await setup(() => of(recipe));

    expect(element.querySelector('h1')?.textContent).toContain('Pancakes esponjosos');
    expect(element.querySelector('.hero__description')?.textContent).toContain('Tortitas altas');

    const facts = element.querySelector('.facts')?.textContent ?? '';
    expect(facts).toContain('20 min');
    expect(facts).toContain('Fácil');
    expect(facts).toContain('4 porciones');

    const amounts = Array.from(element.querySelectorAll('.amount')).map((item) =>
      item.textContent?.trim()
    );
    expect(amounts).toEqual(['200 g', '250,5 ml', '2']);
    expect(element.querySelectorAll('ol.steps li').length).toBe(3);
  });

  it('indica que esta cargando mientras espera la respuesta', async () => {
    const { element } = await setup(() => new Subject<Recipe>());

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando receta');
    expect(element.querySelector('h1')).toBeNull();
  });

  it('avisa cuando la receta no existe', async () => {
    const { element } = await setup(() =>
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    expect(element.querySelector('h1')?.textContent).toContain('No encontramos esa receta');
  });

  it('no consulta la API si el identificador no es valido', async () => {
    const { element, getRecipe } = await setup(() => of(recipe), { id: 'abc' });

    expect(getRecipe).not.toHaveBeenCalled();
    expect(element.querySelector('h1')?.textContent).toContain('No encontramos esa receta');
  });

  it('muestra el error y permite reintentar', async () => {
    let calls = 0;
    const { fixture, element } = await setup(() => {
      calls += 1;
      return calls === 1
        ? throwError(() => new HttpErrorResponse({ status: 500 }))
        : of(recipe);
    });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain(
      'No pudimos cargar la receta'
    );

    (element.querySelector('[role="alert"] button') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelector('h1')?.textContent).toContain('Pancakes esponjosos');
    expect(calls).toBe(2);
  });

  it('pone el nombre de la receta como titulo de la pagina', async () => {
    await setup(() => of(recipe));

    expect(TestBed.inject(Title).getTitle()).toBe('Pancakes esponjosos · RecipeHub');
  });

  it('carga otra receta cuando cambia el identificador', async () => {
    const { fixture, getRecipe } = await setup((id) => of({ ...recipe, id }));

    fixture.componentRef.setInput('id', '9');
    await fixture.whenStable();

    expect(getRecipe.mock.calls.map((call) => call[0])).toEqual([7, 9]);
  });

  describe('eliminar', () => {
    const openDialog = async (options: SetupOptions = {}) => {
      const page = await setup(() => of(recipe), { canWrite: true, ...options });
      (page.element.querySelector('.btn--delete') as HTMLButtonElement).click();
      await page.fixture.whenStable();
      return { ...page, dialog: page.element.querySelector('dialog') as HTMLDialogElement };
    };

    it('no muestra el boton en la demostracion de solo lectura', async () => {
      const { element } = await setup(() => of(recipe), { canWrite: false });

      expect(element.querySelector('.btn--delete')).toBeNull();
      expect(element.querySelector('dialog')).toBeNull();
    });

    it('pide confirmacion antes de eliminar', async () => {
      const { dialog, removeRecipe } = await openDialog();

      expect(dialog.hasAttribute('open')).toBe(true);
      expect(dialog.textContent).toContain('Pancakes esponjosos');
      expect(removeRecipe).not.toHaveBeenCalled();
    });

    it('no elimina nada si se cancela', async () => {
      const { fixture, dialog, removeRecipe } = await openDialog();

      (dialog.querySelector('.btn-secondary') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(dialog.hasAttribute('open')).toBe(false);
      expect(removeRecipe).not.toHaveBeenCalled();
    });

    it('elimina la receta al confirmar, avisa y vuelve al catalogo', async () => {
      const { fixture, dialog, removeRecipe } = await openDialog();

      (dialog.querySelector('.btn-danger') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(removeRecipe).toHaveBeenCalledWith(7);
      expect(TestBed.inject(Notices).message()).toBe('Receta eliminada');
      expect(TestBed.inject(Router).url).toBe('/');
    });

    it('muestra el error en el dialogo y permite intentarlo de nuevo', async () => {
      const { fixture, dialog } = await openDialog({
        deleteRecipe: () => throwError(() => new HttpErrorResponse({ status: 500 })),
      });

      (dialog.querySelector('.btn-danger') as HTMLButtonElement).click();
      await fixture.whenStable();

      expect(dialog.querySelector('[role="alert"]')?.textContent).toContain(
        'No pudimos eliminar la receta'
      );
      expect(dialog.hasAttribute('open')).toBe(true);
      expect((dialog.querySelector('.btn-danger') as HTMLButtonElement).disabled).toBe(false);
    });
  });
});