import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { RecipeSummary } from '../core/models';
import { RecipeCard } from './recipe-card';

const summary: RecipeSummary = {
  id: 7,
  title: 'Pancakes esponjosos',
  description: 'Tortitas altas y suaves.',
  imagePath: 'pancakes.jpg',
  preparationTime: 20,
  difficulty: 'easy',
  servings: 4,
  category: { id: 1, name: 'Desayunos', slug: 'desayunos' },
};

describe('RecipeCard', () => {
  const create = async () => {
    TestBed.configureTestingModule({
      imports: [RecipeCard],
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(RecipeCard);
    fixture.componentRef.setInput('recipe', summary);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  };

  it('muestra el titulo, la categoria, el tiempo y la dificultad', async () => {
    const { element } = await create();
    const text = element.textContent ?? '';

    expect(text).toContain('Pancakes esponjosos');
    expect(text).toContain('Desayunos');
    expect(text).toContain('20 min');
    expect(text).toContain('Fácil');
  });

  it('enlaza con el detalle de la receta', async () => {
    const { element } = await create();

    expect(element.querySelector('a.card__link')?.getAttribute('href')).toBe('/recetas/7');
  });

  it('carga la foto de la receta', async () => {
    const { element } = await create();

    expect(element.querySelector('img')?.getAttribute('src')).toBe('images/pancakes.jpg');
  });

  it('muestra el marcador cuando la foto no carga', async () => {
    const { fixture, element } = await create();

    element.querySelector('img')?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('svg.photo__placeholder')).toBeTruthy();
  });
});