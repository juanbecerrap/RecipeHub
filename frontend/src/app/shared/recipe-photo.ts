import { Component, computed, input, signal } from '@angular/core';

// Foto de una receta. Si el archivo no existe o no carga, muestra un marcador propio.
@Component({
  selector: 'app-recipe-photo',
  template: `
    @if (failed()) {
      <svg class="photo__placeholder" viewBox="0 0 320 200" aria-hidden="true" focusable="false">
        <rect class="ph-bg" width="320" height="200" />
        <circle class="ph-plate" cx="160" cy="100" r="62" />
        <circle class="ph-ring" cx="160" cy="100" r="44" />
        <path class="ph-line" d="M70 58v26c0 7 4 10 8 10s8-3 8-10V58M78 58v30M78 94v48" />
        <path class="ph-line" d="M240 58c10 6 14 22 10 44h-10V58zM240 102v40" />
      </svg>
    } @else {
      <img
        class="photo__image"
        [src]="url()"
        [alt]="alt()"
        width="640"
        height="400"
        [attr.loading]="eager() ? 'eager' : 'lazy'"
        (error)="failed.set(true)"
      />
    }
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .photo__image,
    .photo__placeholder {
      display: block;
      width: 100%;
      height: 100%;
    }

    .photo__image {
      object-fit: cover;
    }

    .ph-bg {
      fill: var(--color-sage-100);
    }

    .ph-plate {
      fill: #ffffff;
      stroke: var(--color-border);
      stroke-width: 3;
    }

    .ph-ring {
      fill: none;
      stroke: var(--color-border);
      stroke-width: 2;
    }

    .ph-line {
      fill: none;
      stroke: var(--color-sage-600);
      stroke-width: 4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class RecipePhoto {
  // Nombre del archivo dentro de la carpeta de imagenes
  readonly path = input.required<string>();
  readonly alt = input('');
  // true para fotos visibles sin hacer scroll
  readonly eager = input(false);

  protected readonly failed = signal(false);
  protected readonly url = computed(() => `images/${this.path()}`);
}