import { Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { errorMessage, showsError } from './form-validators';

// Mensaje de error de un campo. El elemento existe siempre, para poder enlazarlo
// con aria-describedby, y solo contiene texto cuando hay algo que decir.
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="field__error">{{ text }}</p>
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class FieldError {
  readonly control = input.required<AbstractControl>();
  readonly submitted = input(false);

  protected message(): string | null {
    const control = this.control();
    return showsError(control, this.submitted()) ? errorMessage(control) : null;
  }
}