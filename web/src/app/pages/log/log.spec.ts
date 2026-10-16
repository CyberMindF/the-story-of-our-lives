import { formatLogDate } from './log';

describe('formatLogDate', () => {
  it('converts a SQLite UTC timestamp to Italian daylight-saving time', () => {
    expect(formatLogDate('2026-10-16 15:00:00')).toBe('16/10/2026, 17:00:00');
  });

  it('converts UTC using Italian standard time in winter', () => {
    expect(formatLogDate('2026-12-16 15:00:00')).toBe('16/12/2026, 16:00:00');
  });

  it('leaves an invalid timestamp unchanged', () => {
    expect(formatLogDate('data non valida')).toBe('data non valida');
  });
});
