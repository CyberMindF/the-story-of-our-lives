export interface Episode {
  id: string;
  delta: number;
  reason: string;
  psychologistComment: string;
  occurredAt: string;
  createdAt: string;
  revision: number;
}
export interface CounterState { settings: { initialScore: number; createdAt: string; revision: number }; episodes: Episode[]; }
export interface CounterPoint { id: string; time: number; delta: number; total: number; }

export function timeline(state: CounterState): CounterPoint[] {
  const episodes = [...state.episodes].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  let total = state.settings.initialScore;
  const beginning = Math.min(Date.parse(state.settings.createdAt), episodes.length ? Date.parse(episodes[0].occurredAt) - 1 : Infinity);
  return [{ id: 'initial', time: beginning, delta: 0, total }, ...episodes.map(episode => ({
    id: episode.id, time: Date.parse(episode.occurredAt), delta: episode.delta, total: total += episode.delta,
  }))];
}

// La scala si adatta alla base configurata; con base <= 0 il riferimento cromatico resta 20.
export function scoreColor(score: number, initial: number): string {
  const colors = [[119, 134, 121], [139, 129, 119], [164, 118, 123], [211, 144, 168], [240, 91, 153]];
  const position = Math.max(0, Math.min(1, score / (initial > 0 ? initial : 20))) * 4;
  const low = Math.min(3, Math.floor(position)), fraction = position - low;
  return `rgb(${colors[low].map((channel, i) => Math.round(channel + (colors[low + 1][i] - channel) * fraction)).join(', ')})`;
}

export function statistics(state: CounterState, now = Date.now()) {
  const net = state.episodes.reduce((sum, e) => sum + e.delta, 0);
  return { current: state.settings.initialScore + net, net,
    positive: state.episodes.filter(e => e.delta > 0).length,
    negative: state.episodes.filter(e => e.delta < 0).length,
    week: state.episodes.filter(e => Date.parse(e.occurredAt) >= now - 7 * 86400000 && Date.parse(e.occurredAt) <= now).reduce((sum, e) => sum + e.delta, 0) };
}

export function localDateTime(iso: string): string {
  const date = new Date(iso);
  const part = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}
