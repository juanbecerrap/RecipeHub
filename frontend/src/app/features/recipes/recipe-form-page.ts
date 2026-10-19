import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, switchMap } from 'rxjs';

import {
  ApiErrorBody,
  Category,
  Difficulty,
  FieldError,
  Recipe,
  RecipeInput,
} from '../../core/models';
import { Notices } from '../../core/notices';
import { PHOTO_OPTIONS, PhotoOption } from '../../core/photos';
import { RecipesApi } from '../../core/recipes-api';
import { FieldError as FieldErrorMessage } from '../../shared/field-error';
import {
  numberRange,
  optionalText,
  showsError,
  textLength,
} from '../../shared/form-validators';
import { DIFFICULTY_LABELS } from '../../shared/labels';

type LoadStatus = 'loading' | 'ready' | 'notFound' | 'error';

const MAX_ITEMS = 30;

const GENERIC_ERROR = 'No pudimos guardar la receta. Inténtalo de nuevo.';

// Foto que usa la API cuando una receta no tiene ninguna
const DEFAULT_PHOTO = 'default.jpg';

// El servidor responde sin tildes: se muestran con la ortografia correcta
const SERVER_MESSAGES: Record<string, string> = {
  'La categoria no existe': 'La categoría no existe',
  'Ingrediente repetido en la receta': 'Este ingrediente ya está en la receta',
  'Hay ingredientes repetidos en la receta': 'Hay ingredientes repetidos en la receta',
};

const translate = (message: string): string => SERVER_MESSAGES[message] ?? message;

// Un identificador valido es un entero positivo de hasta 10 cifras
const parseId = (value: string): number | null =>
  /^[1-9][0-9]{0,9}$/.test(value) ? Number(value) : null;

const DIRECT_FIELDS = [
  'title',
  'description',
  'categoryId',
  'difficulty',
  'preparationTime',
  'servings',
  'imagePath',
];

@Component({
  imports: [ReactiveFormsModule, RouterLink, FieldErrorMessage],
  selector: 'app-recipe-form-page',
  styleUrl: './recipe-form-page.css',
  templateUrl: './recipe-form-page.html',
})
export class RecipeFormPage {
  // Llega de la direccion en /recetas/:id/editar. Sin identificador, se crea una receta.
  readonly id = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(RecipesApi);
  private readonly router = inject(Router);
  private readonly notices = inject(Notices);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly attempt = signal(0);
  private readonly loadStatus = signal<LoadStatus>('loading');

  protected readonly maxItems = MAX_ITEMS;
  protected readonly difficulties = (['easy', 'medium', 'hard'] as const).map((value) => ({
    value,
    label: DIFFICULTY_LABELS[value],
  }));

  protected readonly editing = computed(() => this.id() !== undefined);
  // Al crear no hay nada que cargar: el formulario esta listo desde el principio
  protected readonly view = computed<LoadStatus>(() =>
    this.editing() ? this.loadStatus() : 'ready'
  );
  protected readonly heading = computed(() => (this.editing() ? 'Editar receta' : 'Nueva receta'));
  protected readonly submitLabel = computed(() =>
    this.editing() ? 'Guardar cambios' : 'Guardar receta'
  );
  protected readonly backLabel = computed(() =>
    this.editing() ? 'Volver a la receta' : 'Volver a las recetas'
  );
  protected readonly backLink = computed<string[]>(() =>
    this.editing() ? ['/recetas', String(this.id())] : ['/']
  );

  protected readonly photos = signal<readonly PhotoOption[]>(PHOTO_OPTIONS);
  protected readonly categories = signal<Category[]>([]);
  protected readonly categoriesFailed = signal(false);
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  protected readonly form = this.fb.group({
    title: this.fb.control('', textLength(3, 120)),
    description: this.fb.control('', textLength(10, 1000)),
    categoryId: this.fb.control<number | null>(null, Validators.required),
    difficulty: this.fb.control<Difficulty | ''>('', Validators.required),
    preparationTime: this.fb.control<number | null>(null, numberRange(1, 1440, { integer: true })),
    servings: this.fb.control<number | null>(null, numberRange(1, 50, { integer: true })),
    imagePath: this.fb.control(''),
    ingredients: this.fb.array([this.newIngredient()]),
    instructions: this.fb.array([this.newStep()]),
  });

  constructor() {
    this.loadCategories();

    // Al editar, se carga la receta (cada cambio de identificador o reintento cancela la anterior)
    toObservable(computed(() => ({ id: this.id(), attempt: this.attempt() })))
      .pipe(
        switchMap(({ id }) => {
          if (id === undefined) {
            return EMPTY;
          }

          const recipeId = parseId(id);
          if (recipeId === null) {
            this.loadStatus.set('notFound');
            return EMPTY;
          }

          this.loadStatus.set('loading');
          return this.api.getRecipe(recipeId).pipe(
            catchError((error: unknown) => {
              const missing =
                error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
              this.loadStatus.set(missing ? 'notFound' : 'error');
              return EMPTY;
            })
          );
        }),
        takeUntilDestroyed()
      )
      .subscribe((recipe) => {
        this.fill(recipe);
        this.loadStatus.set('ready');
      });
  }

  protected loadCategories(): void {
    this.categoriesFailed.set(false);

    this.api
      .getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (categories) => this.categories.set(categories),
        error: () => this.categoriesFailed.set(true),
      });
  }

  protected retryLoad(): void {
    this.attempt.update((value) => value + 1);
  }

  protected invalid(control: AbstractControl): boolean {
    return showsError(control, this.submitted());
  }

  protected addIngredient(): void {
    const list = this.form.controls.ingredients;
    if (list.length >= MAX_ITEMS) {
      return;
    }
    list.push(this.newIngredient());
    this.focusAfterRender(`#ingredient-name-${list.length - 1}`);
  }

  protected removeIngredient(index: number): void {
    const list = this.form.controls.ingredients;
    if (list.length <= 1) {
      return;
    }
    list.removeAt(index);
    this.focusAfterRender('#add-ingredient');
  }

  protected addStep(): void {
    const list = this.form.controls.instructions;
    if (list.length >= MAX_ITEMS) {
      return;
    }
    list.push(this.newStep());
    this.focusAfterRender(`#step-${list.length - 1}`);
  }

  protected removeStep(index: number): void {
    const list = this.form.controls.instructions;
    if (list.length <= 1) {
      return;
    }
    list.removeAt(index);
    this.focusAfterRender('#add-step');
  }

  protected submit(): void {
    if (this.saving()) {
      return;
    }

    this.submitted.set(true);
    this.saveError.set(null);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.saveError.set('Revisa los campos marcados en rojo.');
      this.focusAfterRender('[aria-invalid="true"]');
      return;
    }

    this.saving.set(true);

    const input = this.toInput();
    const id = this.id();
    const request =
      id === undefined ? this.api.createRecipe(input) : this.api.updateRecipe(Number(id), input);

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (recipe) => {
        this.notices.show(id === undefined ? 'Receta guardada' : 'Cambios guardados');
        void this.router.navigate(['/recetas', recipe.id]);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.handleSaveError(error);
      },
    });
  }

  private newIngredient(initial: { name: string; quantity: number; unit: string } | null = null) {
    return this.fb.group({
      name: this.fb.control(initial?.name ?? '', textLength(2, 100)),
      quantity: this.fb.control<number | null>(
        initial?.quantity ?? null,
        numberRange(0.01, 99999.99, { decimals: 2 })
      ),
      unit: this.fb.control(initial?.unit ?? '', optionalText(20)),
    });
  }

  private newStep(initial = '') {
    return this.fb.control(initial, textLength(3, 500));
  }

  // Rellena el formulario con una receta existente
  private fill(recipe: Recipe): void {
    const { ingredients, instructions } = this.form.controls;

    ingredients.clear();
    for (const item of recipe.ingredients) {
      ingredients.push(
        this.newIngredient({ name: item.name, quantity: item.quantity, unit: item.unit })
      );
    }
    if (ingredients.length === 0) {
      ingredients.push(this.newIngredient());
    }

    instructions.clear();
    for (const step of recipe.instructions) {
      instructions.push(this.newStep(step));
    }
    if (instructions.length === 0) {
      instructions.push(this.newStep());
    }

    // Una foto que no esta en la lista se conserva como "Foto actual": el PUT reemplaza la receta
    // completa y, sin esto, la receta perderia su foto al guardar
    const hasPhoto = recipe.imagePath !== DEFAULT_PHOTO;
    if (hasPhoto && !PHOTO_OPTIONS.some((option) => option.value === recipe.imagePath)) {
      this.photos.set([
        ...PHOTO_OPTIONS,
        { value: recipe.imagePath, label: `Foto actual (${recipe.imagePath})` },
      ]);
    }

    this.form.patchValue({
      title: recipe.title,
      description: recipe.description,
      categoryId: recipe.category.id,
      difficulty: recipe.difficulty,
      preparationTime: recipe.preparationTime,
      servings: recipe.servings,
      imagePath: hasPhoto ? recipe.imagePath : '',
    });
    this.form.markAsPristine();
  }

  // Los datos ya estan validados: se limpian los espacios y se omite la foto si no se eligio
  private toInput(): RecipeInput {
    const value = this.form.getRawValue();

    return {
      title: value.title.trim(),
      description: value.description.trim(),
      ...(value.imagePath ? { imagePath: value.imagePath } : {}),
      preparationTime: value.preparationTime as number,
      difficulty: value.difficulty as Difficulty,
      servings: value.servings as number,
      categoryId: value.categoryId as number,
      instructions: value.instructions.map((step) => step.trim()),
      ingredients: value.ingredients.map((ingredient) => ({
        name: ingredient.name.trim(),
        quantity: ingredient.quantity as number,
        unit: ingredient.unit.trim(),
      })),
    };
  }

  private handleSaveError(error: unknown): void {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 403) {
        this.saveError.set('Esta demostración es de solo lectura.');
        return;
      }
      if (error.status === 404) {
        this.saveError.set('La receta ya no existe.');
        return;
      }
      if (error.status === 429) {
        this.saveError.set('Hay demasiadas peticiones. Espera un momento e inténtalo de nuevo.');
        return;
      }
      if (error.status === 422) {
        this.applyServerDetails(error);
        return;
      }
    }
    this.saveError.set(GENERIC_ERROR);
  }

  // Cada error del servidor se coloca junto a su campo
  private applyServerDetails(error: HttpErrorResponse): void {
    const body = error.error as Partial<ApiErrorBody> | null;
    const details = body?.error?.details ?? [];
    const unmapped: FieldError[] = [];

    for (const detail of details) {
      const control = this.controlFor(detail.field);
      if (control) {
        control.setErrors({ server: translate(detail.message) });
        control.markAsTouched();
      } else {
        unmapped.push(detail);
      }
    }

    if (unmapped.length > 0) {
      this.saveError.set(translate(unmapped[0].message));
    } else if (details.length > 0) {
      this.saveError.set('Revisa los campos marcados en rojo.');
    } else {
      this.saveError.set(GENERIC_ERROR);
    }
    this.focusAfterRender('[aria-invalid="true"]');
  }

  // 'title', 'ingredients[0].name' o 'instructions[2]' -> el campo del formulario
  private controlFor(path: string): AbstractControl | null {
    if (DIRECT_FIELDS.includes(path)) {
      return this.form.get(path);
    }

    const ingredient = /^ingredients\[(\d+)\]\.(name|quantity|unit)$/.exec(path);
    if (ingredient) {
      return this.form.controls.ingredients.at(Number(ingredient[1]))?.get(ingredient[2]) ?? null;
    }

    const step = /^instructions\[(\d+)\]$/.exec(path);
    if (step) {
      return this.form.controls.instructions.at(Number(step[1])) ?? null;
    }

    return null;
  }

  private focusAfterRender(selector: string): void {
    afterNextRender(
      () => {
        this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus();
      },
      { injector: this.injector }
    );
  }
}