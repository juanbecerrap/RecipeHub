import { parseRecipeId } from './recipe-id';

describe('parseRecipeId', () => {
  it('acepta enteros positivos de hasta 10 cifras', () => {
    expect(parseRecipeId('1')).toBe(1);
    expect(parseRecipeId('7')).toBe(7);
    expect(parseRecipeId('9999999999')).toBe(9999999999);
  });

  it('rechaza lo que no es un entero positivo', () => {
    for (const value of ['', 'abc', '0', '-1', '1.5', '01', ' 7', '7 ', '1 OR 1=1']) {
      expect(parseRecipeId(value), value).toBeNull();
    }
  });

  it('rechaza numeros de mas de 10 cifras', () => {
    expect(parseRecipeId('12345678901')).toBeNull();
  });
});