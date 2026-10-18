import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { App } from './app';

@Component({ selector: 'app-test-page', template: '<h1>Pagina de prueba</h1>' })
class TestPage {}

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

describe('App al navegar', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: TestPage },
          { path: 'otra', component: TestPage },
        ]),
      ],
    }).compileComponents();
  });

  it('mueve el foco al contenido al cambiar de pagina, pero no en la carga inicial', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    const main = (fixture.nativeElement as HTMLElement).querySelector('main');

    await router.navigateByUrl('/');
    await fixture.whenStable();
    expect(document.activeElement).not.toBe(main);

    await router.navigateByUrl('/otra');
    await fixture.whenStable();
    expect(document.activeElement).toBe(main);
  });
});