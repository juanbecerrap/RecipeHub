-- database/schema.sql
-- Esquema relacional de RecipeHub. Ejecutar con un usuario con permisos de CREATE.
-- Es seguro ejecutarlo varias veces: no borra datos existentes.

USE recipehub;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(60) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recipes (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  image_path VARCHAR(255) NOT NULL DEFAULT 'default.jpg',
  preparation_time SMALLINT UNSIGNED NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') NOT NULL,
  servings TINYINT UNSIGNED NOT NULL,
  instructions TEXT NOT NULL,
  category_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_recipes_category (category_id),
  CONSTRAINT fk_recipes_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_recipes_time CHECK (preparation_time BETWEEN 1 AND 1440),
  CONSTRAINT chk_recipes_servings CHECK (servings BETWEEN 1 AND 50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ingredients (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ingredients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id INT UNSIGNED NOT NULL,
  ingredient_id INT UNSIGNED NOT NULL,
  quantity DECIMAL(8, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT '',
  PRIMARY KEY (recipe_id, ingredient_id),
  KEY idx_recipe_ingredients_ingredient (ingredient_id),
  CONSTRAINT fk_recipe_ingredients_recipe FOREIGN KEY (recipe_id)
    REFERENCES recipes (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_recipe_ingredients_ingredient FOREIGN KEY (ingredient_id)
    REFERENCES ingredients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_recipe_ingredients_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;