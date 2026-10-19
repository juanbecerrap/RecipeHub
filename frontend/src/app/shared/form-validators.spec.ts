import { FormControl } from '@angular/forms';

import { errorMessage, numberRange, optionalText, showsError, textLength } from './form-validators';

describe('textLength', () => {
  const validator = textLength(3, 10);

  it('exige texto y no cuenta los espacios de los extremos', () => {
    expect(validator(new FormControl(''))).toEqual({ required: true });
    expect(validator(new FormControl('   '))).toEqual({ required: true });
    expect(validator(new FormControl('  ab  '))).toEqual({ length: { min: 3, max: 10 } });
    expect(validator(new FormControl('  abc  '))).toBeNull();
  });

  it('rechaza los textos demasiado largos', () => {
    expect(validator(new FormControl('abcdefghijk'))).toEqual({ length: { min: 3, max: 10 } });
    expect(validator(new FormControl('abcdefghij'))).toBeNull();
  });
});

describe('optionalText', () => {
  it('permite el texto vacio y limita la longitud', () => {
    const validator = optionalText(5);

    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl('abcde'))).toBeNull();
    expect(validator(new FormControl('abcdef'))).toEqual({ length: { min: 0, max: 5 } });
  });
});

describe('numberRange', () => {
  it('exige un numero', () => {
    const validator = numberRange(1, 50);

    expect(validator(new FormControl(null))).toEqual({ required: true });
    expect(validator(new FormControl(''))).toEqual({ required: true });
    expect(validator(new FormControl(Number.NaN))).toEqual({ number: true });
  });

  it('comprueba el rango', () => {
    const validator = numberRange(1, 50);

    expect(validator(new FormControl(0))).toEqual({ range: { min: 1, max: 50 } });
    expect(validator(new FormControl(51))).toEqual({ range: { min: 1, max: 50 } });
    expect(validator(new FormControl(1))).toBeNull();
    expect(validator(new FormControl(50))).toBeNull();
  });

  it('comprueba enteros y decimales', () => {
    expect(numberRange(1, 50, { integer: true })(new FormControl(4.5))).toEqual({ integer: true });
    expect(numberRange(1, 50, { integer: true })(new FormControl(4))).toBeNull();

    const decimals = numberRange(0.01, 100, { decimals: 2 });
    expect(decimals(new FormControl(1.234))).toEqual({ decimals: { max: 2 } });
    expect(decimals(new FormControl(1.25))).toBeNull();
  });
});

describe('errorMessage', () => {
  const messageFor = (errors: Record<string, unknown>): string | null => {
    const control = new FormControl('');
    control.setErrors(errors);
    return errorMessage(control);
  };

  it('traduce cada error a un texto en espanol', () => {
    expect(messageFor({ required: true })).toBe('Este campo es obligatorio');
    expect(messageFor({ length: { min: 3, max: 10 } })).toBe('Debe tener entre 3 y 10 caracteres');
    expect(messageFor({ length: { min: 0, max: 20 } })).toBe('Debe tener como máximo 20 caracteres');
    expect(messageFor({ range: { min: 0.01, max: 99999.99 } })).toBe('Debe estar entre 0,01 y 99999,99');
    expect(messageFor({ integer: true })).toBe('Debe ser un número entero');
    expect(messageFor({ decimals: { max: 2 } })).toBe('Admite como máximo 2 decimales');
    expect(messageFor({ number: true })).toBe('Escribe un número válido');
  });

  it('da prioridad al error del servidor y no muestra nada si no hay errores', () => {
    expect(messageFor({ required: true, server: 'Texto del servidor' })).toBe('Texto del servidor');
    expect(errorMessage(new FormControl('valor'))).toBeNull();
  });
});

describe('showsError', () => {
  it('solo muestra el error si se toco el campo o se envio el formulario', () => {
    const control = new FormControl('');
    control.setErrors({ required: true });

    expect(showsError(control, false)).toBe(false);
    expect(showsError(control, true)).toBe(true);

    control.markAsTouched();
    expect(showsError(control, false)).toBe(true);

    const valid = new FormControl('ok');
    valid.markAsTouched();
    expect(showsError(valid, true)).toBe(false);
  });
});