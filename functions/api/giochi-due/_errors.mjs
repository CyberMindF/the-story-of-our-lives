export class GameError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}
export function check(value, message, status) { if (!value) throw new GameError(message, status); }
