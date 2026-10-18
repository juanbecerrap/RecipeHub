import { DIFFICULTY_LABELS, formatMinutes } from './labels';

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