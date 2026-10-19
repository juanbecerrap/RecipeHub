import { Component, ElementRef, inject } from '@angular/core';

import { Notices } from '../core/notices';

@Component({
  selector: 'app-notice-banner',
  template: `
    <div role="status">
      @if (notices.message(); as text) {
        <div class="container">
          <div class="notice">
            <p class="notice__text">{{ text }}</p>
            <button type="button" class="notice__close" (click)="close()">
              <span class="visually-hidden">Cerrar aviso</span>
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .notice {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      margin-top: var(--space-4);
      padding: var(--space-3) var(--space-4);
      border: 1px solid var(--color-sage-600);
      border-radius: var(--radius-md);
      background: var(--color-sage-100);
      color: var(--color-sage-700);
    }

    .notice__text {
      margin: var(--space-2) 0;
      font-weight: 600;
    }

    .notice__close {
      display: inline-flex;
      flex: none;
      align-items: center;
      justify-content: center;
      width: 2.75rem;
      height: 2.75rem;
      margin: calc(var(--space-2) * -1) calc(var(--space-3) * -1) calc(var(--space-2) * -1) 0;
      padding: 0;
      border: 0;
      border-radius: var(--radius-pill);
      background: transparent;
      color: inherit;
      cursor: pointer;
    }

    .notice__close:hover {
      background: rgb(63 90 69 / 12%);
    }
  `,
})
export class NoticeBanner {
  protected readonly notices = inject(Notices);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected close(): void {
    this.notices.dismiss();
    // El boton desaparece con el aviso: el foco pasa al contenido principal
    this.host.nativeElement.ownerDocument.getElementById('contenido')?.focus();
  }
}