import { Component, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { SiteFooter } from './layout/site-footer';
import { SiteHeader } from './layout/site-header';

@Component({
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  constructor() {
    let previousPath: string | null = null;

    inject(Router)
      .events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];

        // Al cambiar de pagina el foco pasa al contenido (no en la carga inicial
        // ni cuando solo cambian los parametros de la direccion)
        if (previousPath !== null && path !== previousPath) {
          this.main().nativeElement.focus();
        }
        previousPath = path;
      });
  }
}