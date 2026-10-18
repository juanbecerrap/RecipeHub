import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { RecipeSummary } from '../../core/models';
import { RecipesApi } from '../../core/recipes-api';
import { RecipeCard } from '../../shared/recipe-card';

type LoadStatus = 'loading' | 'ready' | 'error';

@Component({
  imports: [RecipeCard],
  selector: 'app-catalog-page',
  styleUrl: './catalog-page.css',
  templateUrl: './catalog-page.html',
})
export class CatalogPage implements OnInit {
  private readonly api = inject(RecipesApi);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly status = signal<LoadStatus>('loading');
  protected readonly recipes = signal<RecipeSummary[]>([]);

  // Tarjetas esqueleto mientras se cargan los datos
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  // Texto que anuncian los lectores de pantalla
  protected readonly summary = computed(() => {
    if (this.status() === 'loading') {
      return 'Cargando recetas…';
    }
    if (this.status() === 'error') {
      return '';
    }
    const total = this.recipes().length;
    if (total === 0) {
      return '';
    }
    return total === 1 ? '1 receta' : `${total} recetas`;
  });

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.status.set('loading');

    this.api
      .getRecipes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (recipes) => {
          this.recipes.set(recipes);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }
}