import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ApiResponse,
  Category,
  HealthStatus,
  Recipe,
  RecipeFilters,
  RecipeInput,
  RecipeSummary,
} from './models';

// Acceso a la API de RecipeHub: un metodo por cada ruta del backend.
@Injectable({ providedIn: 'root' })
export class RecipesApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  getHealth(): Observable<HealthStatus> {
    return this.http
      .get<ApiResponse<HealthStatus>>(`${this.baseUrl}/health`)
      .pipe(map((response) => response.data));
  }

  getCategories(): Observable<Category[]> {
    return this.http
      .get<ApiResponse<Category[]>>(`${this.baseUrl}/categories`)
      .pipe(map((response) => response.data));
  }

  getRecipes(filters: RecipeFilters = {}): Observable<RecipeSummary[]> {
    let params = new HttpParams();

    const search = filters.search?.trim();
    if (search) {
      params = params.set('search', search);
    }
    if (filters.category) {
      params = params.set('category', String(filters.category));
    }
    if (filters.difficulty) {
      params = params.set('difficulty', filters.difficulty);
    }

    return this.http
      .get<ApiResponse<RecipeSummary[]>>(`${this.baseUrl}/recipes`, { params })
      .pipe(map((response) => response.data));
  }

  getRecipe(id: number): Observable<Recipe> {
    return this.http
      .get<ApiResponse<Recipe>>(`${this.baseUrl}/recipes/${id}`)
      .pipe(map((response) => response.data));
  }

  createRecipe(input: RecipeInput): Observable<Recipe> {
    return this.http
      .post<ApiResponse<Recipe>>(`${this.baseUrl}/recipes`, input)
      .pipe(map((response) => response.data));
  }

  updateRecipe(id: number, input: RecipeInput): Observable<Recipe> {
    return this.http
      .put<ApiResponse<Recipe>>(`${this.baseUrl}/recipes/${id}`, input)
      .pipe(map((response) => response.data));
  }

  deleteRecipe(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/recipes/${id}`);
  }
}