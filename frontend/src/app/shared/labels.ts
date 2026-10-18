import { Difficulty } from '../core/models';

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
};

// 20 -> "20 min", 60 -> "1 h", 90 -> "1 h 30 min"
export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) {
    return `${rest} min`;
  }
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
};

const quantityFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });

// (200, 'g') -> "200 g", (2, '') -> "2", (250.5, 'ml') -> "250,5 ml"
export const formatAmount = (quantity: number, unit: string): string =>
  `${quantityFormat.format(quantity)} ${unit}`.trim();

// 1 -> "1 porción", 4 -> "4 porciones"
export const formatServings = (servings: number): string =>
  servings === 1 ? '1 porción' : `${servings} porciones`;