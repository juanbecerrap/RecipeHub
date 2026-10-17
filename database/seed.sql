-- database/seed.sql
-- Datos iniciales de RecipeHub: categorias, ingredientes y 8 recetas de ejemplo.
-- Se puede ejecutar varias veces. Las lineas de ingredientes de las recetas 1 a 8
-- se reemplazan en cada ejecucion; las recetas creadas despues (id 9 en adelante)
-- no se tocan. Ejecutar con: mysql -u root -p --default-character-set=utf8mb4 < database\seed.sql

SET NAMES utf8mb4;
USE recipehub;

START TRANSACTION;

-- Categorias
INSERT INTO categories (id, name, slug) VALUES
  (1, 'Desayunos', 'desayunos'),
  (2, 'Entradas', 'entradas'),
  (3, 'Ensaladas', 'ensaladas'),
  (4, 'Sopas y cremas', 'sopas-y-cremas'),
  (5, 'Platos principales', 'platos-principales'),
  (6, 'Postres', 'postres')
AS new_row
ON DUPLICATE KEY UPDATE name = new_row.name, slug = new_row.slug;

-- Ingredientes
INSERT INTO ingredients (name) VALUES
  ('Harina de trigo'), ('Leche'), ('Huevos'), ('Azúcar'), ('Polvo de hornear'),
  ('Mantequilla'), ('Sal'), ('Aguacates'), ('Tomates'), ('Cebolla'),
  ('Limones'), ('Cilantro fresco'), ('Mozzarella'), ('Albahaca fresca'), ('Aceite de oliva'),
  ('Pimienta negra'), ('Calabaza'), ('Ajo'), ('Caldo de verduras'), ('Nata para cocinar'),
  ('Patatas'), ('Espaguetis'), ('Tomates triturados'), ('Muslos de pollo'), ('Arroz'),
  ('Caldo de pollo'), ('Perejil fresco'), ('Chocolate negro'), ('Cacao en polvo'), ('Nueces')
AS new_row
ON DUPLICATE KEY UPDATE name = new_row.name;

-- Recetas (instrucciones: un paso por linea)
INSERT INTO recipes
  (id, title, description, image_path, preparation_time, difficulty, servings, instructions, category_id)
VALUES
  (1, 'Pancakes esponjosos',
   'Tortitas altas y suaves, perfectas para un desayuno de fin de semana con fruta o miel.',
   'pancakes.jpg', 20, 'easy', 4,
   CONCAT_WS('\n',
     'Mezcla en un bol la harina, el azúcar, el polvo de hornear y la sal.',
     'En otro bol bate los huevos con la leche y la mantequilla derretida.',
     'Une las dos mezclas con movimientos suaves, sin batir de más, y deja reposar 5 minutos.',
     'Calienta una sartén antiadherente y vierte un cucharón de masa por cada pancake.',
     'Cocina hasta que salgan burbujas en la superficie, dale la vuelta y dora el otro lado.',
     'Sirve templados con fruta, miel o sirope.'),
   1),
  (2, 'Guacamole casero',
   'Crema fresca de aguacate con tomate, cebolla y limón, ideal para compartir.',
   'guacamole.jpg', 15, 'easy', 4,
   CONCAT_WS('\n',
     'Pica muy fino la cebolla, el tomate y el cilantro.',
     'Abre los aguacates, retira el hueso y aplasta la pulpa con un tenedor.',
     'Añade la cebolla, el tomate y el cilantro.',
     'Agrega el zumo de limón y la sal, y mezcla bien.',
     'Prueba, ajusta de sal y sirve enseguida con nachos o tostadas.'),
   2),
  (3, 'Ensalada caprese',
   'Clásico italiano de tomate, mozzarella y albahaca con un chorrito de aceite de oliva.',
   'ensalada-caprese.jpg', 10, 'easy', 2,
   CONCAT_WS('\n',
     'Lava los tomates y córtalos en rodajas.',
     'Corta la mozzarella en rodajas del mismo grosor.',
     'Alterna tomate y mozzarella en un plato.',
     'Añade las hojas de albahaca, el aceite de oliva, la sal y la pimienta.',
     'Sirve a temperatura ambiente.'),
   3),
  (4, 'Crema de calabaza',
   'Crema suave y reconfortante de calabaza con un toque de nata.',
   'crema-calabaza.jpg', 40, 'easy', 4,
   CONCAT_WS('\n',
     'Pela la calabaza y córtala en cubos; pica la cebolla y el ajo.',
     'Sofríe la cebolla y el ajo en el aceite de oliva a fuego medio durante 5 minutos.',
     'Añade la calabaza y rehoga 3 minutos.',
     'Vierte el caldo, salpimienta y cuece 20 minutos, hasta que la calabaza esté tierna.',
     'Tritura hasta obtener una crema fina y añade la nata.',
     'Calienta un minuto más y sirve caliente.'),
   4),
  (5, 'Tortilla de patatas',
   'La tortilla española de siempre: patata, huevo y cebolla, jugosa por dentro.',
   'tortilla-patatas.jpg', 45, 'medium', 4,
   CONCAT_WS('\n',
     'Pela las patatas y córtalas en láminas finas; pica la cebolla.',
     'Fríe las patatas y la cebolla en el aceite a fuego medio-bajo, unos 20 minutos, sin que se doren.',
     'Escurre las patatas y mézclalas con los huevos batidos y la sal.',
     'Deja reposar la mezcla 5 minutos.',
     'Cuaja la mezcla en una sartén con un poco de aceite, a fuego medio, unos 4 minutos.',
     'Dale la vuelta con ayuda de un plato y cocina 3 minutos más por el otro lado.'),
   2),
  (6, 'Pasta al pomodoro',
   'Pasta con una salsa de tomate sencilla, fresca y con mucho sabor.',
   'pasta-pomodoro.jpg', 30, 'medium', 2,
   CONCAT_WS('\n',
     'Cuece los espaguetis en agua con sal siguiendo el tiempo del paquete.',
     'Mientras tanto, dora el ajo laminado en el aceite de oliva a fuego suave.',
     'Añade el tomate triturado, la sal y el azúcar y cocina 15 minutos.',
     'Escurre la pasta y mézclala con la salsa.',
     'Termina con hojas de albahaca fresca y sirve al momento.'),
   5),
  (7, 'Pollo al limón con arroz',
   'Muslos de pollo dorados con limón y ajo, cocinados junto al arroz en una sola olla.',
   'pollo-limon-arroz.jpg', 50, 'medium', 4,
   CONCAT_WS('\n',
     'Sazona los muslos con sal y pimienta.',
     'Dóralos en el aceite de oliva por ambos lados y resérvalos.',
     'En la misma olla sofríe la cebolla y el ajo picados durante 5 minutos.',
     'Añade el arroz y remueve un minuto.',
     'Vierte el caldo y el zumo de un limón, y devuelve el pollo a la olla.',
     'Tapa y cocina a fuego bajo unos 25 minutos, hasta que el arroz esté tierno.',
     'Sirve con perejil picado y rodajas del otro limón.'),
   5),
  (8, 'Brownies de chocolate',
   'Brownies densos y húmedos de chocolate negro, con nueces y corteza crujiente.',
   'brownies.jpg', 55, 'hard', 9,
   CONCAT_WS('\n',
     'Precalienta el horno a 180 grados y forra un molde cuadrado de 20 cm con papel de horno.',
     'Derrite el chocolate con la mantequilla al baño maría y deja templar.',
     'Bate los huevos con el azúcar hasta que espesen.',
     'Incorpora el chocolate derretido a los huevos.',
     'Tamiza la harina, el cacao y la sal, y mézclalos con movimientos suaves.',
     'Añade las nueces troceadas y vierte la masa en el molde.',
     'Hornea unos 25 minutos: el centro debe quedar un poco húmedo.',
     'Deja enfriar por completo antes de cortar en cuadrados.'),
   6)
AS new_row
ON DUPLICATE KEY UPDATE
  title = new_row.title,
  description = new_row.description,
  image_path = new_row.image_path,
  preparation_time = new_row.preparation_time,
  difficulty = new_row.difficulty,
  servings = new_row.servings,
  instructions = new_row.instructions,
  category_id = new_row.category_id;

-- Ingredientes de cada receta: se reemplazan las lineas de las recetas 1 a 8
DELETE FROM recipe_ingredients WHERE recipe_id BETWEEN 1 AND 8;

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
SELECT v.recipe_id, i.id, v.quantity, v.unit
FROM (
  SELECT 1 AS recipe_id, 'Harina de trigo' AS ingredient_name, 200 AS quantity, 'g' AS unit
  UNION ALL SELECT 1, 'Leche', 250, 'ml'
  UNION ALL SELECT 1, 'Huevos', 2, ''
  UNION ALL SELECT 1, 'Azúcar', 2, 'cda'
  UNION ALL SELECT 1, 'Polvo de hornear', 1, 'cda'
  UNION ALL SELECT 1, 'Mantequilla', 30, 'g'
  UNION ALL SELECT 1, 'Sal', 1, 'pizca'

  UNION ALL SELECT 2, 'Aguacates', 3, ''
  UNION ALL SELECT 2, 'Tomates', 1, ''
  UNION ALL SELECT 2, 'Cebolla', 40, 'g'
  UNION ALL SELECT 2, 'Limones', 1, ''
  UNION ALL SELECT 2, 'Cilantro fresco', 15, 'g'
  UNION ALL SELECT 2, 'Sal', 1, 'pizca'

  UNION ALL SELECT 3, 'Tomates', 3, ''
  UNION ALL SELECT 3, 'Mozzarella', 200, 'g'
  UNION ALL SELECT 3, 'Albahaca fresca', 10, 'g'
  UNION ALL SELECT 3, 'Aceite de oliva', 2, 'cda'
  UNION ALL SELECT 3, 'Sal', 1, 'pizca'
  UNION ALL SELECT 3, 'Pimienta negra', 1, 'pizca'

  UNION ALL SELECT 4, 'Calabaza', 800, 'g'
  UNION ALL SELECT 4, 'Cebolla', 1, ''
  UNION ALL SELECT 4, 'Ajo', 2, 'dientes'
  UNION ALL SELECT 4, 'Caldo de verduras', 700, 'ml'
  UNION ALL SELECT 4, 'Aceite de oliva', 2, 'cda'
  UNION ALL SELECT 4, 'Nata para cocinar', 100, 'ml'
  UNION ALL SELECT 4, 'Sal', 1, 'cdta'
  UNION ALL SELECT 4, 'Pimienta negra', 1, 'pizca'

  UNION ALL SELECT 5, 'Patatas', 500, 'g'
  UNION ALL SELECT 5, 'Huevos', 5, ''
  UNION ALL SELECT 5, 'Cebolla', 1, ''
  UNION ALL SELECT 5, 'Aceite de oliva', 150, 'ml'
  UNION ALL SELECT 5, 'Sal', 1, 'cdta'

  UNION ALL SELECT 6, 'Espaguetis', 200, 'g'
  UNION ALL SELECT 6, 'Tomates triturados', 400, 'g'
  UNION ALL SELECT 6, 'Ajo', 2, 'dientes'
  UNION ALL SELECT 6, 'Aceite de oliva', 3, 'cda'
  UNION ALL SELECT 6, 'Albahaca fresca', 8, 'g'
  UNION ALL SELECT 6, 'Sal', 1, 'cdta'
  UNION ALL SELECT 6, 'Azúcar', 1, 'cdta'

  UNION ALL SELECT 7, 'Muslos de pollo', 4, ''
  UNION ALL SELECT 7, 'Arroz', 300, 'g'
  UNION ALL SELECT 7, 'Limones', 2, ''
  UNION ALL SELECT 7, 'Ajo', 3, 'dientes'
  UNION ALL SELECT 7, 'Cebolla', 1, ''
  UNION ALL SELECT 7, 'Caldo de pollo', 600, 'ml'
  UNION ALL SELECT 7, 'Aceite de oliva', 2, 'cda'
  UNION ALL SELECT 7, 'Sal', 1, 'cdta'
  UNION ALL SELECT 7, 'Pimienta negra', 1, 'pizca'
  UNION ALL SELECT 7, 'Perejil fresco', 10, 'g'

  UNION ALL SELECT 8, 'Chocolate negro', 200, 'g'
  UNION ALL SELECT 8, 'Mantequilla', 150, 'g'
  UNION ALL SELECT 8, 'Azúcar', 200, 'g'
  UNION ALL SELECT 8, 'Huevos', 3, ''
  UNION ALL SELECT 8, 'Harina de trigo', 90, 'g'
  UNION ALL SELECT 8, 'Cacao en polvo', 30, 'g'
  UNION ALL SELECT 8, 'Sal', 1, 'pizca'
  UNION ALL SELECT 8, 'Nueces', 80, 'g'
) AS v
JOIN ingredients AS i ON i.name = v.ingredient_name;

COMMIT;