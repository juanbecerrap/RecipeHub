import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { RecipeSummary } from '../core/models';
import { DIFFICULTY_LABELS, formatMinutes } from './labels';
import { RecipePhoto } from './recipe-photo';

@Component({
  imports: [RouterLink, RecipePhoto],
  selector: 'app-recipe-card',
  styleUrl: './recipe-card.css',
  templateUrl: './recipe-card.html',
})
export class RecipeCard {
  readonly recipe = input.required<RecipeSummary>();

  protected readonly difficultyLabel = computed(() => DIFFICULTY_LABELS[this.recipe().difficulty]);
  protected readonly time = computed(() => formatMinutes(this.recipe().preparationTime));
}