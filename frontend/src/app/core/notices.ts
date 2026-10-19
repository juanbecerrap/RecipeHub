import { Injectable, signal } from '@angular/core';

// Aviso breve que se muestra bajo la cabecera (por ejemplo, "Receta guardada").
@Injectable({ providedIn: 'root' })
export class Notices {
  private readonly current = signal<string | null>(null);

  readonly message = this.current.asReadonly();

  show(text: string): void {
    this.current.set(text);
  }

  dismiss(): void {
    this.current.set(null);
  }
}