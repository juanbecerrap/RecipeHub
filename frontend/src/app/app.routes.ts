import { Routes } from '@angular/router';

import { writeGuard } from './core/write-guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Recetas · RecipeHub',
    loadComponent: () => import('./features/recipes/catalog-page').then((m) => m.CatalogPage),
  },
  // Las rutas fijas y mas especificas deben ir ANTES de 'recetas/:id'.
  // Las de escritura estan protegidas: en la demostracion de solo lectura se redirige al catalogo.
  {
    path: 'recetas/nueva',
    title: 'Nueva receta · RecipeHub',
    canActivate: [writeGuard],
    loadComponent: () =>
      import('./features/recipes/recipe-form-page').then((m) => m.RecipeFormPage),
  },
  {
    path: 'recetas/:id/editar',
    title: 'Editar receta · RecipeHub',
    canActivate: [writeGuard],
    loadComponent: () =>
      import('./features/recipes/recipe-form-page').then((m) => m.RecipeFormPage),
  },
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