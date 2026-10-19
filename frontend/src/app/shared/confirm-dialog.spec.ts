import { TestBed } from '@angular/core/testing';

import '../../testing/dialog-polyfill';
import { ConfirmDialog } from './confirm-dialog';

describe('ConfirmDialog', () => {
  const create = async (inputs: Record<string, unknown> = {}) => {
    TestBed.configureTestingModule({ imports: [ConfirmDialog] });
    const fixture = TestBed.createComponent(ConfirmDialog);
    fixture.componentRef.setInput('heading', '¿Eliminar esta receta?');
    fixture.componentRef.setInput('message', 'Esta accion no se puede deshacer.');
    fixture.componentRef.setInput('confirmLabel', 'Si, eliminar');
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    return {
      fixture,
      element,
      dialog: element.querySelector('dialog') as HTMLDialogElement,
      cancel: element.querySelector('.btn-secondary') as HTMLButtonElement,
      confirm: element.querySelector('.btn-danger') as HTMLButtonElement,
    };
  };

  it('esta cerrado hasta que se abre y se cierra con Cancelar', async () => {
    const { fixture, dialog, cancel } = await create();
    expect(dialog.hasAttribute('open')).toBe(false);

    fixture.componentInstance.open();
    expect(dialog.hasAttribute('open')).toBe(true);
    expect(dialog.textContent).toContain('¿Eliminar esta receta?');

    cancel.click();
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('avisa cuando se confirma', async () => {
    const { fixture, confirm } = await create();
    let confirmations = 0;
    fixture.componentInstance.confirmed.subscribe(() => (confirmations += 1));

    fixture.componentInstance.open();
    confirm.click();

    expect(confirmations).toBe(1);
    expect(confirm.textContent).toContain('Si, eliminar');
  });

  it('desactiva los botones mientras trabaja', async () => {
    const { cancel, confirm } = await create({ busy: true });

    expect(cancel.disabled).toBe(true);
    expect(confirm.disabled).toBe(true);
  });

  it('muestra un mensaje de error', async () => {
    const { element } = await create({ errorMessage: 'No pudimos eliminar la receta.' });

    expect(element.querySelector('[role="alert"]')?.textContent).toContain('No pudimos eliminar');
  });

  it('solo bloquea la tecla Escape mientras trabaja', async () => {
    const idle = await create();
    const idleEvent = new Event('cancel', { cancelable: true });
    idle.dialog.dispatchEvent(idleEvent);
    expect(idleEvent.defaultPrevented).toBe(false);

    TestBed.resetTestingModule();

    const busy = await create({ busy: true });
    const busyEvent = new Event('cancel', { cancelable: true });
    busy.dialog.dispatchEvent(busyEvent);
    expect(busyEvent.defaultPrevented).toBe(true);
  });
});