import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';

import { Recipe } from '../../core/models';
import { RecipesApi } from '../../core/recipes-api';
import {
  DIFFICULTY_LABELS,
  formatAmount,
  formatMinutes,
  formatServings,
} from '../../shared/labels';
import { RecipePhoto } from '../../shared/recipe-photo';

type DetailStatus = 'loading' | 'ready' | 'notFound' | 'error';

// Un identificador valido es un entero positivo de hasta 10 cifras
const parseRecipeId = (value: string): number | null =>
  /^[1-9][0-9]{0,9}$/.test(value) ? Number(value) : null;

@Component({
  imports: [RouterLink, RecipePhoto],
  selector: 'app-recipe-detail-page',
  styleUrl: './recipe-detail-page.css',
  templateUrl: './recipe-detail-page.html',
})
export class RecipeDetailPage {
  // Llega de la direccion (/recetas/:id) mediante el enlace de parametros con entradas
  readonly id = input.required<string>();

  private readonly api = inject(RecipesApi);
  private readonly pageTitle = inject(Title);
  private readonly attempt = signal(0);

  protected readonly status = signal<DetailStatus>('loading');
  protected readonly recipe = signal<Recipe | null>(null);

  protected readonly time = computed(() => {
    const recipe = this.recipe();
    return recipe ? formatMinutes(recipe.preparationTime) : '';
  });

  protected readonly difficultyLabel = computed(() => {
    const recipe = this.recipe();
    return recipe ? DIFFICULTY_LABELS[recipe.difficulty] : '';
  });

  protected readonly servings = computed(() => {
    const recipe = this.recipe();
    return recipe ? formatServings(recipe.servings) : '';
  });

  protected readonly ingredients = computed(() =>
    (this.recipe()?.ingredients ?? []).map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name,
      amount: formatAmount(ingredient.quantity, ingredient.unit),
    }))
  );

  constructor() {
    // Cada cambio de identificador (o reintento) cancela la peticion anterior
    toObservable(computed(() => ({ id: this.id(), attempt: this.attempt() })))
      .pipe(
        tap(() => {
          this.status.set('loading');
          this.recipe.set(null);
        }),
        switchMap(({ id }) => {
          const recipeId = parseRecipeId(id);
          if (recipeId === null) {
            this.showNotFound();
            return EMPTY;
          }

          return this.api.getRecipe(recipeId).pipe(
            catchError((error: unknown) => {
              const missing =
                error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
              if (missing) {
                this.showNotFound();
              } else {
                this.status.set('error');
              }
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe((recipe) => {
        this.recipe.set(recipe);
        this.status.set('ready');
        this.pageTitle.setTitle(`${recipe.title} · RecipeHub`);
      });
  }

  protected retry(): void {
    this.attempt.update((value) => value + 1);
  }

  private showNotFound(): void {
    this.status.set('notFound');
    this.pageTitle.setTitle('Receta no encontrada · RecipeHub');
  }
}