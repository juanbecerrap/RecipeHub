import { Component } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  template: `
    <footer class="site-footer">
      <div class="container site-footer__inner">
        <p>Descubre, organiza y prepara tus recetas favoritas.</p>
        <p>© {{ year }} RecipeHub</p>
      </div>
    </footer>
  `,
  styles: `
    .site-footer {
      padding-block: var(--space-6);
      border-top: 1px solid var(--color-border);
      background: var(--color-surface);
      color: var(--color-text-muted);
    }

    .site-footer__inner {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: var(--space-2) var(--space-5);
    }

    .site-footer p {
      margin: 0;
    }
  `,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
}