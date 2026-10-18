import { DIFFICULTY_LABELS, formatAmount, formatMinutes, formatServings } from './labels';

describe('formatMinutes', () => {
  it('muestra solo minutos por debajo de una hora', () => {
    expect(formatMinutes(20)).toBe('20 min');
    expect(formatMinutes(59)).toBe('59 min');
  });

  it('muestra horas exactas', () => {
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(1440)).toBe('24 h');
  });

  it('combina horas y minutos', () => {
    expect(formatMinutes(90)).toBe('1 h 30 min');
  });
});

describe('DIFFICULTY_LABELS', () => {
  it('traduce los niveles de dificultad', () => {
    expect(DIFFICULTY_LABELS).toEqual({ easy: 'Fácil', medium: 'Media', hard: 'Difícil' });
  });
});

describe('formatAmount', () => {
  it('une la cantidad con la unidad y usa coma decimal', () => {
    expect(formatAmount(200, 'g')).toBe('200 g');
    expect(formatAmount(250.5, 'ml')).toBe('250,5 ml');
    expect(formatAmount(0.25, '')).toBe('0,25');
  });

  it('no deja espacios sobrantes cuando no hay unidad', () => {
    expect(formatAmount(2, '')).toBe('2');
  });
});

describe('formatServings', () => {
  it('usa singular y plural', () => {
    expect(formatServings(1)).toBe('1 porción');
    expect(formatServings(4)).toBe('4 porciones');
  });
});