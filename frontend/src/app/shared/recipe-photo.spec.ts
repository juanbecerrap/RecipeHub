import { TestBed } from '@angular/core/testing';

import { RecipePhoto } from './recipe-photo';

describe('RecipePhoto', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [RecipePhoto] });
  });

  const create = async (inputs: Record<string, unknown>) => {
    const fixture = TestBed.createComponent(RecipePhoto);
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  it('carga la foto desde la carpeta de imagenes', async () => {
    const image = (await create({ path: 'pancakes.jpg' })).querySelector('img');

    expect(image?.getAttribute('src')).toBe('images/pancakes.jpg');
    expect(image?.getAttribute('alt')).toBe('');
    expect(image?.getAttribute('loading')).toBe('lazy');
  });

  it('permite indicar un texto alternativo', async () => {
    const image = (await create({ path: 'pancakes.jpg', alt: 'Foto de unos pancakes' })).querySelector('img');

    expect(image?.getAttribute('alt')).toBe('Foto de unos pancakes');
  });

  it('carga al instante las fotos prioritarias', async () => {
    const image = (await create({ path: 'pancakes.jpg', eager: true })).querySelector('img');

    expect(image?.getAttribute('loading')).toBe('eager');
  });

  it('muestra un marcador cuando la foto no carga', async () => {
    const fixture = TestBed.createComponent(RecipePhoto);
    fixture.componentRef.setInput('path', 'pancakes.jpg');
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    element.querySelector('img')?.dispatchEvent(new Event('error'));
    await fixture.whenStable();

    expect(element.querySelector('img')).toBeNull();
    expect(element.querySelector('svg.photo__placeholder')).toBeTruthy();
  });
});