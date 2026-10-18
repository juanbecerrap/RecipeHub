import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Recetas · RecipeHub',
    loadComponent: () => import('./features/recipes/catalog-page').then((m) => m.CatalogPage),
  },
  // Fase 5: las rutas 'recetas/nueva' y 'recetas/:id/editar' deben ir ANTES de esta
  {
    path: 'recetas/:id',
    title: 'Receta · RecipeHub',
    loadComponent: () =>
      import('./features/recipes/recipe-detail-page').then((m) => m.RecipeDetailPage),
  },
  {
    path: '**',
    title: 'Página no encontrada · RecipeHub',
    loadComponent: () =>
      import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];