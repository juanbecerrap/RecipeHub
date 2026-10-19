import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { WriteAccess } from '../core/write-access';

// 'page' en el catalogo, 'true' dentro de una receta (misma seccion), nada en otro sitio
const currentSection = (url: string): 'page' | 'true' | null => {
  const path = url.split(/[?#]/)[0];
  if (path === '/') {
    return 'page';
  }
  return path === '/recetas' || path.startsWith('/recetas/') ? 'true' : null;
};

@Component({
  imports: [RouterLink],
  selector: 'app-site-header',
  styleUrl: './site-header.css',
  templateUrl: './site-header.html',
})
export class SiteHeader {
  private readonly router = inject(Router);

  protected readonly canWrite = inject(WriteAccess).canWrite;

  protected readonly current = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => currentSection(event.urlAfterRedirects)),
      startWith(currentSection(this.router.url))
    ),
    { requireSync: true }
  );
}