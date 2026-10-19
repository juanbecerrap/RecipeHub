// Fotos disponibles para las recetas: son archivos de frontend/public/images.
// Si anades una foto nueva a esa carpeta, anade aqui su nombre.

export interface PhotoOption {
  value: string;
  label: string;
}

export const PHOTO_OPTIONS: readonly PhotoOption[] = [
  { value: '', label: 'Sin foto' },
  { value: 'pancakes.jpg', label: 'Pancakes' },
  { value: 'guacamole.jpg', label: 'Guacamole' },
  { value: 'ensalada-caprese.jpg', label: 'Ensalada caprese' },
  { value: 'crema-calabaza.jpg', label: 'Crema de calabaza' },
  { value: 'tortilla-patatas.jpg', label: 'Tortilla de patatas' },
  { value: 'pasta-pomodoro.jpg', label: 'Pasta al pomodoro' },
  { value: 'pollo-limon-arroz.jpg', label: 'Pollo al limón con arroz' },
  { value: 'brownies.jpg', label: 'Brownies' },
];