import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { EMPTY, catchError, debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs';

import { Category, Difficulty, RecipeFilters, RecipeSummary } from '../../core/models';
import { RecipesApi } from '../../core/recipes-api';
import { DIFFICULTY_LABELS } from '../../shared/labels';
import { RecipeCard } from '../../shared/recipe-card';

type LoadStatus = 'loading' | 'ready' | 'error';
type CatalogView = 'error' | 'skeleton' | 'empty' | 'grid';

// Pausa tras la ultima tecla antes de consultar la API
const SEARCH_DELAY_MS = 300;

@Component({
  imports: [RecipeCard],
  selector: 'app-catalog-page',
  styleUrl: './catalog-page.css',
  templateUrl: './catalog-page.html',
})
export class CatalogPage {
  private readonly api = inject(RecipesApi);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly categories = signal<Category[]>([]);
  protected readonly difficulties = (['easy', 'medium', 'hard'] as const).map((value) => ({
    value,
    label: DIFFICULTY_LABELS[value],
  }));

  // Filtros: el texto cambia con cada tecla; el aplicado llega tras una pausa
  protected readonly searchText = signal('');
  private readonly appliedSearch = signal('');
  protected readonly category = signal<number | null>(null);
  protected readonly difficulty = signal<Difficulty | null>(null);
  private readonly attempt = signal(0);

  protected readonly status = signal<LoadStatus>('loading');
  protected readonly hasLoaded = signal(false);
  protected readonly recipes = signal<RecipeSummary[]>([]);

  // Tarjetas esqueleto de la primera carga
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];

  private readonly filters = computed<RecipeFilters>(() => ({
    search: this.appliedSearch(),
    category: this.category(),
    difficulty: this.difficulty(),
  }));

  // El boton de limpiar se activa en cuanto hay algo escrito o elegido
  protected readonly hasFilters = computed(
    () => this.searchText().trim() !== '' || this.category() !== null || this.difficulty() !== null
  );

  // Hay filtros ya aplicados a los resultados mostrados
  protected readonly filtersApplied = computed(
    () => this.appliedSearch() !== '' || this.category() !== null || this.difficulty() !== null
  );

  protected readonly view = computed<CatalogView>(() => {
    if (this.status() === 'error') return 'error';
    if (!this.hasLoaded()) return 'skeleton';
    if (this.recipes().length === 0 && this.status() === 'ready') return 'empty';
    return 'grid';
  });

  // Texto que anuncian los lectores de pantalla
  protected readonly summary = computed(() => {
    if (this.status() === 'loading') {
      return this.hasLoaded() ? 'Buscando recetas…' : 'Cargando recetas…';
    }
    if (this.status() === 'error') {
      return '';
    }

    const total = this.recipes().length;
    if (total === 0) {
      return this.filtersApplied() ? 'Sin resultados' : '';
    }
    if (this.filtersApplied()) {
      return total === 1 ? '1 receta encontrada' : `${total} recetas encontradas`;
    }
    return total === 1 ? '1 receta' : `${total} recetas`;
  });

  constructor() {
    // Si las categorias no cargan, el filtro queda solo con "Todas"
    this.api
      .getCategories()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categories.set([]),
      });

    toObservable(this.searchText)
      .pipe(debounceTime(SEARCH_DELAY_MS), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((text) => this.appliedSearch.set(text.trim()));

    // Cada cambio de filtros (o reintento) cancela la peticion anterior
    toObservable(computed(() => ({ filters: this.filters(), attempt: this.attempt() })))
      .pipe(
        tap(() => this.status.set('loading')),
        switchMap(({ filters }) =>
          this.api.getRecipes(filters).pipe(
            catchError(() => {
              this.status.set('error');
              return EMPTY;
            })
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((recipes) => {
        this.recipes.set(recipes);
        this.status.set('ready');
        this.hasLoaded.set(true);
      });
  }

  protected onSearch(event: Event): void {
    this.searchText.set((event.target as HTMLInputElement).value);
  }

  protected onCategory(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.category.set(value === '' ? null : Number(value));
  }

  protected onDifficulty(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.difficulty.set(value === '' ? null : (value as Difficulty));
  }

  protected clearFilters(): void {
    this.searchText.set('');
    this.appliedSearch.set('');
    this.category.set(null);
    this.difficulty.set(null);
    // El boton que tenia el foco se desactiva o desaparece: el foco vuelve al buscador
    this.searchInput().nativeElement.focus();
  }

  protected retry(): void {
    this.attempt.update((value) => value + 1);
  }
}