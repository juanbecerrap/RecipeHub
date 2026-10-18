import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Recetas · RecipeHub',
    loadComponent: () => import('./features/recipes/catalog-page').then((m) => m.CatalogPage),
  },
  {
    path: '**',
    title: 'Página no encontrada · RecipeHub',
    loadComponent: () =>
      import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];