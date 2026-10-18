import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-not-found-page',
  template: `
    <section class="container not-found">
      <h1>No encontramos esa página</h1>
      <p>La dirección no existe o la receta ya no está disponible.</p>
      <a class="btn btn-primary" routerLink="/">Volver a las recetas</a>
    </section>
  `,
  styles: `
    .not-found {
      padding-block: var(--space-7);
      text-align: center;
    }
  `,
})
export class NotFoundPage {}