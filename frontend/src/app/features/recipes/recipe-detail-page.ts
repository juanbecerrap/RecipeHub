import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, input, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap, tap } from 'rxjs';

import { Recipe } from '../../core/models';
import { Notices } from '../../core/notices';
import { RecipesApi } from '../../core/recipes-api';
import { WriteAccess } from '../../core/write-access';
import { ConfirmDialog } from '../../shared/confirm-dialog';
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
  imports: [RouterLink, RecipePhoto, ConfirmDialog],
  selector: 'app-recipe-detail-page',
  styleUrl: './recipe-detail-page.css',
  templateUrl: './recipe-detail-page.html',
})
export class RecipeDetailPage {
  // Llega de la direccion (/recetas/:id) mediante el enlace de parametros con entradas
  readonly id = input.required<string>();

  private readonly api = inject(RecipesApi);
  private readonly pageTitle = inject(Title);
  private readonly router = inject(Router);
  private readonly notices = inject(Notices);
  private readonly destroyRef = inject(DestroyRef);
  private readonly attempt = signal(0);
  private readonly confirmDialog = viewChild(ConfirmDialog);

  protected readonly canWrite = inject(WriteAccess).canWrite;

  protected readonly status = signal<DetailStatus>('loading');
  protected readonly recipe = signal<Recipe | null>(null);

  protected readonly deleting = signal(false);
  protected readonly deleteError = signal<string | null>(null);

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

  protected readonly deleteMessage = computed(() => {
    const recipe = this.recipe();
    return recipe
      ? `Se eliminará «${recipe.title}» con sus ingredientes y sus pasos. Esta acción no se puede deshacer.`
      : '';
  });

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

  protected askDelete(): void {
    this.deleteError.set(null);
    this.confirmDialog()?.open();
  }

  protected confirmDelete(): void {
    const recipe = this.recipe();
    if (!recipe) {
      return;
    }

    this.deleting.set(true);
    this.deleteError.set(null);

    this.api
      .deleteRecipe(recipe.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notices.show('Receta eliminada');
          void this.router.navigate(['/']);
        },
        error: (error: unknown) => {
          this.deleting.set(false);
          this.deleteError.set(this.deleteErrorText(error));
        },
      });
  }

  private deleteErrorText(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        return 'Esta demostración es de solo lectura.';
      }
      if (error.status === 404) {
        return 'La receta ya no existe.';
      }
    }
    return 'No pudimos eliminar la receta. Inténtalo de nuevo.';
  }

  private showNotFound(): void {
    this.status.set('notFound');
    this.pageTitle.setTitle('Receta no encontrada · RecipeHub');
  }
}