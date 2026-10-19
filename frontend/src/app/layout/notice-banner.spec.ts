import { TestBed } from '@angular/core/testing';

import { Notices } from '../core/notices';
import { NoticeBanner } from './notice-banner';

describe('NoticeBanner', () => {
  const create = async () => {
    TestBed.configureTestingModule({ imports: [NoticeBanner] });
    const fixture = TestBed.createComponent(NoticeBanner);
    await fixture.whenStable();
    return { fixture, element: fixture.nativeElement as HTMLElement, notices: TestBed.inject(Notices) };
  };

  it('no muestra nada si no hay aviso, pero mantiene la region para lectores de pantalla', async () => {
    const { element } = await create();

    expect(element.querySelector('[role="status"]')).toBeTruthy();
    expect(element.querySelector('.notice')).toBeNull();
  });

  it('muestra el aviso', async () => {
    const { fixture, element, notices } = await create();

    notices.show('Receta guardada');
    await fixture.whenStable();

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Receta guardada');
  });

  it('se cierra con el boton', async () => {
    const { fixture, element, notices } = await create();
    notices.show('Receta guardada');
    await fixture.whenStable();

    (element.querySelector('.notice__close') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(element.querySelector('.notice')).toBeNull();
    expect(notices.message()).toBeNull();
  });
});