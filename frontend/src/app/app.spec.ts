import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from './app';

describe('App', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('se crea correctamente', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra la cabecera, el contenido principal y el pie', async () => {
    const element = await render();
    expect(element.querySelector('header')).toBeTruthy();
    expect(element.querySelector('main#contenido')).toBeTruthy();
    expect(element.querySelector('footer')).toBeTruthy();
  });

  it('ofrece un enlace para saltar al contenido', async () => {
    const element = await render();
    const link = element.querySelector('a.skip-link');
    expect(link?.getAttribute('href')).toBe('#contenido');
  });

  it('muestra el nombre de la marca en la cabecera', async () => {
    const element = await render();
    expect(element.querySelector('.brand__name')?.textContent).toContain('RecipeHub');
  });
});