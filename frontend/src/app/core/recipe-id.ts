// Un identificador valido es un entero positivo de hasta 10 cifras.
// Devuelve null si el texto no lo es.
export const parseRecipeId = (value: string): number | null =>
  /^[1-9][0-9]{0,9}$/.test(value) ? Number(value) : null;