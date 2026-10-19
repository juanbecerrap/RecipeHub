import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ApiErrorBody, Category, Difficulty, FieldError, RecipeInput } from '../../core/models';
import { Notices } from '../../core/notices';
import { PHOTO_OPTIONS } from '../../core/photos';
import { RecipesApi } from '../../core/recipes-api';
import { FieldError as FieldErrorMessage } from '../../shared/field-error';
import {
  numberRange,
  optionalText,
  showsError,
  textLength,
} from '../../shared/form-validators';
import { DIFFICULTY_LABELS } from '../../shared/labels';

const MAX_ITEMS = 30;

const GENERIC_ERROR = 'No pudimos guardar la receta. Inténtalo de nuevo.';

// El servidor responde sin tildes: se muestran con la ortografia correcta
const SERVER_MESSAGES: Record<string, string> = {
  'La categoria no existe': 'La categoría no existe',
  'Ingrediente repetido en la receta': 'Este ingrediente ya está en la receta',
  'Hay ingredientes repetidos en la receta': 'Hay ingredientes repetidos en la receta',
};

const translate = (message: string): string => SERVER_MESSAGES[message] ?? message;

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
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly api = inject(RecipesApi);
  private readonly router = inject(Router);
  private readonly notices = inject(Notices);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly maxItems = MAX_ITEMS;
  protected readonly photos = PHOTO_OPTIONS;
  protected readonly difficulties = (['easy', 'medium', 'hard'] as const).map((value) => ({
    value,
    label: DIFFICULTY_LABELS[value],
  }));

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

    this.api
      .createRecipe(this.toInput())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (recipe) => {
          this.notices.show('Receta guardada');
          void this.router.navigate(['/recetas', recipe.id]);
        },
        error: (error: unknown) => {
          this.saving.set(false);
          this.handleSaveError(error);
        },
      });
  }

  private newIngredient() {
    return this.fb.group({
      name: this.fb.control('', textLength(2, 100)),
      quantity: this.fb.control<number | null>(null, numberRange(0.01, 99999.99, { decimals: 2 })),
      unit: this.fb.control('', optionalText(20)),
    });
  }

  private newStep() {
    return this.fb.control('', textLength(3, 500));
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