import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RecipeSummary } from '../core/models';
import { DIFFICULTY_LABELS, formatMinutes } from './labels';

@Component({
  imports: [RouterLink],
  selector: 'app-recipe-card',
  styleUrl: './recipe-card.css',
  templateUrl: './recipe-card.html',
})
export class RecipeCard {
  readonly recipe = input.required<RecipeSummary>();

  // Si la foto no existe o falla, se muestra el marcador
  protected readonly imageFailed = signal(false);

  protected readonly imageUrl = computed(() => `images/${this.recipe().imagePath}`);
  protected readonly difficultyLabel = computed(() => DIFFICULTY_LABELS[this.recipe().difficulty]);
  protected readonly time = computed(() => formatMinutes(this.recipe().preparationTime));
}