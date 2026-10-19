import { Component, ElementRef, input, output, viewChild } from '@angular/core';

// Dialogo modal de confirmacion con el elemento nativo <dialog>:
// el navegador bloquea el resto de la pagina, atrapa el foco y gestiona Escape.
@Component({
  selector: 'app-confirm-dialog',
  template: `
    <dialog
      #dialog
      class="dialog"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      (cancel)="onCancel($event)"
    >
      <h2 id="confirm-title" class="dialog__title">{{ heading() }}</h2>
      <p id="confirm-message">{{ message() }}</p>

      @if (errorMessage(); as text) {
        <p class="alert alert--error" role="alert">{{ text }}</p>
      }

      <div class="dialog__actions">
        <button type="button" class="btn btn-secondary" [disabled]="busy()" (click)="close()">
          {{ cancelLabel() }}
        </button>
        <button type="button" class="btn btn-danger" [disabled]="busy()" (click)="confirmed.emit()">
          {{ confirmLabel() }}
        </button>
      </div>
    </dialog>
  `,
  styles: `
    .dialog {
      width: min(92vw, 28rem);
      padding: var(--space-5);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: var(--shadow-md);
    }

    .dialog::backdrop {
      background: rgb(47 42 36 / 55%);
    }

    .dialog__title {
      font-size: 1.4rem;
    }

    .dialog__actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-5);
    }
  `,
})
export class ConfirmDialog {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  // Mientras trabaja, los botones se desactivan y Escape no cierra el dialogo
  readonly busy = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly confirmed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  open(): void {
    const element = this.dialog().nativeElement;
    if (!element.hasAttribute('open')) {
      element.showModal();
    }
  }

  close(): void {
    this.dialog().nativeElement.close();
  }

  protected onCancel(event: Event): void {
    if (this.busy()) {
      event.preventDefault();
    }
  }
}