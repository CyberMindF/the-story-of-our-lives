import { Component, OnDestroy, computed, signal } from '@angular/core';

type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 100;

interface DiceTerm {
  sides: DieSides;
  count: number;
}

interface RolledDie {
  sides: DieSides;
  value: number;
  x: number;
  spin: number;
}

interface DiceRollHistory {
  id: number;
  notation: string;
  values: number[];
  total: number;
}

const DICE: DieSides[] = [4, 6, 8, 10, 12, 20, 100];

@Component({
  selector: 'app-gdr-dice-roller',
  standalone: true,
  templateUrl: './gdr-dice-roller.html',
  styleUrl: './gdr-dice-roller.css'
})
export class GdrDiceRoller implements OnDestroy {
  protected readonly dice = DICE;
  protected readonly expression = signal('1d20');
  protected readonly terms = signal<DiceTerm[]>([{ sides: 20, count: 1 }]);
  protected readonly modifier = signal(0);
  protected readonly rolls = signal<RolledDie[]>([]);
  protected readonly rolling = signal(false);
  protected readonly inputError = signal('');
  protected readonly history = signal<DiceRollHistory[]>([]);
  protected readonly total = computed(() => this.rolls().reduce((sum, die) => sum + die.value, 0) + this.modifier());
  protected readonly notation = computed(() => this.formatNotation(this.terms(), this.modifier()));
  private animationTimer?: ReturnType<typeof setTimeout>;
  private historyId = 0;

  constructor() {
    this.roll(false);
  }

  protected applyExpression(): void {
    const parsed = this.parseExpression(this.expression());
    if (!parsed) {
      this.inputError.set('Scrivi per esempio 1d20, 5d12 oppure 2d6 + 3');
      return;
    }
    this.inputError.set('');
    this.terms.set(parsed.terms);
    this.modifier.set(parsed.modifier);
    this.expression.set(this.formatNotation(parsed.terms, parsed.modifier));
    this.roll();
  }

  protected updateExpression(event: Event): void {
    this.expression.set((event.target as HTMLInputElement).value);
    this.inputError.set('');
  }

  protected addDie(sides: DieSides): void {
    const current = this.terms();
    const existing = current.find((term) => term.sides === sides);
    const totalDice = current.reduce((sum, term) => sum + term.count, 0);
    if (totalDice >= 20) return;
    const next = existing
      ? current.map((term) => term.sides === sides ? { ...term, count: term.count + 1 } : term)
      : [...current, { sides, count: 1 }];
    this.terms.set(next);
    this.expression.set(this.formatNotation(next, this.modifier()));
    this.roll();
  }

  protected removeDie(index: number): void {
    if (this.rolling()) return;
    const remaining = this.rolls().filter((_, rollIndex) => rollIndex !== index);
    const removed = this.rolls()[index];
    if (!removed) return;
    const next = this.terms()
      .map((term) => term.sides === removed.sides ? { ...term, count: term.count - 1 } : term)
      .filter((term) => term.count > 0);
    this.terms.set(next);
    this.rolls.set(remaining);
    this.expression.set(this.formatNotation(next, this.modifier()));
  }

  protected clear(): void {
    if (this.rolling()) return;
    this.terms.set([]);
    this.modifier.set(0);
    this.rolls.set([]);
    this.expression.set('');
    this.inputError.set('');
  }

  protected roll(animate = true): void {
    if (this.rolling() || this.terms().length === 0) return;
    if (this.animationTimer) clearTimeout(this.animationTimer);
    const dice = this.terms().flatMap((term) => Array.from({ length: term.count }, (_, index): RolledDie => ({
      sides: term.sides,
      value: this.randomInt(term.sides),
      x: this.randomInt(18) - 9,
      spin: (this.randomInt(3) + 2) * 360 * (index % 2 === 0 ? 1 : -1)
    })));
    this.rolls.set(dice);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.rolling.set(animate && !reduced);
    const finish = () => {
      this.rolling.set(false);
      const values = dice.map((die) => die.value);
      this.history.update((history) => [{
        id: ++this.historyId,
        notation: this.notation(),
        values,
        total: values.reduce((sum, value) => sum + value, 0) + this.modifier()
      }, ...history].slice(0, 4));
      this.animationTimer = undefined;
    };
    if (animate && !reduced) this.animationTimer = setTimeout(finish, 720);
    else finish();
  }

  ngOnDestroy(): void {
    if (this.animationTimer) clearTimeout(this.animationTimer);
  }

  private parseExpression(raw: string): { terms: DiceTerm[]; modifier: number } | null {
    const compact = raw.toLowerCase().replace(/\s+/g, '');
    if (!compact) return null;
    const tokenPattern = /([+-]?)(\d*)d(100|20|12|10|8|6|4)|([+-]\d+)/gy;
    const terms = new Map<DieSides, number>();
    let modifier = 0;
    let consumed = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenPattern.exec(compact)) !== null) {
      if (match.index !== consumed) return null;
      consumed = tokenPattern.lastIndex;
      if (match[5]) {
        modifier += Number(match[5]);
        continue;
      }
      if (match[1] === '-') return null;
      const count = Number(match[2] || 1);
      const sides = Number(match[3]) as DieSides;
      if (count < 1 || count > 20) return null;
      terms.set(sides, (terms.get(sides) ?? 0) + count);
    }
    const parsed = [...terms].map(([sides, count]) => ({ sides, count }));
    const totalDice = parsed.reduce((sum, term) => sum + term.count, 0);
    if (consumed !== compact.length || totalDice < 1 || totalDice > 20 || Math.abs(modifier) > 100) return null;
    return { terms: parsed, modifier };
  }

  private formatNotation(terms: DiceTerm[], modifier: number): string {
    const dice = terms.map((term) => `${term.count}d${term.sides}`).join(' + ');
    if (!dice) return '';
    if (modifier === 0) return dice;
    return `${dice} ${modifier > 0 ? '+' : '−'} ${Math.abs(modifier)}`;
  }

  private randomInt(max: number): number {
    const limit = Math.floor(0x100000000 / max) * max;
    const value = new Uint32Array(1);
    do crypto.getRandomValues(value); while (value[0] >= limit);
    return (value[0] % max) + 1;
  }
}
