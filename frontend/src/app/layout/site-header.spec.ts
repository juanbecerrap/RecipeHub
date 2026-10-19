import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SiteHeader } from './site-header';

@Component({ selector: 'app-blank-page', template: '' })
class BlankPage {}

describe('SiteHeader', () => {
  const link = async (url: string) => {
    TestBed.configureTestingModule({
      imports: [SiteHeader],
      providers: [
        provideRouter([
          { path: '', component: BlankPage },
          { path: 'recetas/:id', component: BlankPage },
          { path: 'otra', component: BlankPage },
        ]),
      ],
    });

    const fixture = TestBed.createComponent(SiteHeader);
    await TestBed.inject(Router).navigateByUrl(url);
    await fixture.whenStable();

    return (fixture.nativeElement as HTMLElement).querySelector('.nav__link') as HTMLElement;
  };

  it('marca Recetas como pagina actual en el catalogo', async () => {
    const recipes = await link('/');

    expect(recipes.getAttribute('aria-current')).toBe('page');
    expect(recipes.classList).toContain('is-active');
  });

  it('mantiene Recetas resaltado dentro de una receta', async () => {
    const recipes = await link('/recetas/7');

    expect(recipes.getAttribute('aria-current')).toBe('true');
    expect(recipes.classList).toContain('is-active');
  });

  it('no resalta Recetas en otras paginas', async () => {
    const recipes = await link('/otra');

    expect(recipes.getAttribute('aria-current')).toBeNull();
    expect(recipes.classList).not.toContain('is-active');
  });
});