import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Validadores y textos de error de los formularios. Reflejan las reglas de la API.

const numberFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2, useGrouping: false });

// Texto obligatorio con longitud entre min y max (sin contar espacios en los extremos)
export const textLength =
  (min: number, max: number): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    if (value === '') {
      return { required: true };
    }
    return value.length < min || value.length > max ? { length: { min, max } } : null;
  };

// Texto opcional con longitud maxima
export const optionalText =
  (max: number): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const value = typeof control.value === 'string' ? control.value.trim() : '';
    return value.length > max ? { length: { min: 0, max } } : null;
  };

// Numero obligatorio dentro de un rango, opcionalmente entero o con un maximo de decimales
export const numberRange =
  (min: number, max: number, options: { integer?: boolean; decimals?: number } = {}): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (value === null || value === undefined || value === '') {
      return { required: true };
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return { number: true };
    }
    if (value < min || value > max) {
      return { range: { min, max } };
    }
    if (options.integer && !Number.isInteger(value)) {
      return { integer: true };
    }
    if (options.decimals !== undefined) {
      const factor = 10 ** options.decimals;
      if (Math.round(value * factor) / factor !== value) {
        return { decimals: { max: options.decimals } };
      }
    }
    return null;
  };

// Un error solo se muestra cuando se toco el campo o se intento enviar el formulario
export const showsError = (control: AbstractControl, submitted: boolean): boolean =>
  control.invalid && (control.touched || submitted);

// Texto en espanol del primer error del campo
export const errorMessage = (control: AbstractControl): string | null => {
  const errors = control.errors;
  if (!errors) {
    return null;
  }

  // Error devuelto por el servidor: tiene prioridad
  if (typeof errors['server'] === 'string') {
    return errors['server'];
  }
  if (errors['required']) {
    return 'Este campo es obligatorio';
  }
  if (errors['length']) {
    const { min, max } = errors['length'];
    return min === 0
      ? `Debe tener como máximo ${max} caracteres`
      : `Debe tener entre ${min} y ${max} caracteres`;
  }
  if (errors['range']) {
    const { min, max } = errors['range'];
    return `Debe estar entre ${numberFormat.format(min)} y ${numberFormat.format(max)}`;
  }
  if (errors['integer']) {
    return 'Debe ser un número entero';
  }
  if (errors['decimals']) {
    return `Admite como máximo ${errors['decimals'].max} decimales`;
  }
  if (errors['number']) {
    return 'Escribe un número válido';
  }
  return 'El valor no es válido';
};