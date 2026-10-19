import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Recetas · RecipeHub',
    loadComponent: () => import('./features/recipes/catalog-page').then((m) => m.CatalogPage),
  },
  // Las rutas fijas ('recetas/nueva') deben ir ANTES de 'recetas/:id'
  {
    path: 'recetas/nueva',
    title: 'Nueva receta · RecipeHub',
    loadComponent: () =>
      import('./features/recipes/recipe-form-page').then((m) => m.RecipeFormPage),
  },
  // Paso 5.4: 'recetas/:id/editar' tambien ira antes de esta
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