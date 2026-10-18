// Tipos que describen los datos que intercambian el frontend y la API.

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Category {
  id: number;
  name: string;
  slug: string;
}

// Datos de una receta en el catalogo
export interface RecipeSummary {
  id: number;
  title: string;
  description: string;
  imagePath: string;
  preparationTime: number;
  difficulty: Difficulty;
  servings: number;
  category: Category;
}

export interface RecipeIngredient {
  id: number;
  name: string;
  quantity: number;
  unit: string;
}

// Receta completa (detalle)
export interface Recipe extends RecipeSummary {
  instructions: string[];
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

export interface IngredientInput {
  name: string;
  quantity: number;
  unit: string;
}

// Datos que se envian para crear o editar una receta
export interface RecipeInput {
  title: string;
  description: string;
  imagePath?: string;
  preparationTime: number;
  difficulty: Difficulty;
  servings: number;
  categoryId: number;
  instructions: string[];
  ingredients: IngredientInput[];
}

export interface RecipeFilters {
  search?: string;
  category?: number | null;
  difficulty?: Difficulty | null;
}

export interface HealthStatus {
  status: 'ok';
  database: 'ok';
  readOnly: boolean;
}

// Envoltorio de las respuestas correctas de la API
export interface ApiResponse<T> {
  ok: true;
  data: T;
}

export interface FieldError {
  field: string;
  message: string;
}

// Cuerpo de las respuestas de error de la API
export interface ApiErrorBody {
  ok: false;
  error: {
    message: string;
    details?: FieldError[];
  };
}