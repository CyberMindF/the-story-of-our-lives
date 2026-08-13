import { Component, computed, inject } from '@angular/core';
import { WorldSettingsService } from '../core/world-settings.service';
import { randomBetween } from './random';

const STICKER_COUNT = 42;

export type StickerKind = 'rainbow' | 'unicorn' | 'icecream' | 'sun' | 'moon' | 'teddy' | 'heart' | 'candy' | 'star' | 'donut' | 'lollipop' | 'bow' | 'butterfly' | 'cookie' | 'chocolate' | 'cake' | 'fries' | 'pizza';
export const STICKER_KIND_LABEL: Record<StickerKind, string> = {
  rainbow: 'Arcobaleni',
  unicorn: 'Unicorni',
  icecream: 'Gelati',
  sun: 'Soli',
  moon: 'Lune',
  teddy: 'Orsetti',
  heart: 'Cuori',
  candy: 'Caramelle',
  star: 'Stelle',
  donut: 'Ciambelle',
  lollipop: 'Lecca-lecca',
  bow: 'Fiocchi',
  butterfly: 'Farfalle',
  cookie: 'Biscotti',
  chocolate: 'Cioccolato',
  cake: 'Torte',
  fries: 'Patatine',
  pizza: 'Pizza'
};

const STICKER_EMOJI: Record<StickerKind, string> = {
  rainbow: '🌈',
  unicorn: '🦄',
  icecream: '🍦',
  sun: '☀️',
  moon: '🌙',
  teddy: '🧸',
  heart: '💖',
  candy: '🍬',
  star: '⭐',
  donut: '🍩',
  lollipop: '🍭',
  bow: '🎀',
  butterfly: '🦋',
  cookie: '🍪',
  chocolate: '🍫',
  cake: '🍰',
  fries: '🍟',
  pizza: '🍕'
};

const ALL_STICKER_KINDS: StickerKind[] = Object.keys(STICKER_KIND_LABEL) as StickerKind[];

interface Sticker {
  kind: StickerKind;
  x: number;
  size: number;
  opacity: number;
  sway: number;
  rotateStart: number;
  rotateEnd: number;
  fallDuration: number;
  fallDelay: number;
}

// Sfondo decorativo (#e3): stickerini stupidi e carini che cadono, come i fiori di
// world-petals.ts (stessa meccanica di caduta, .world-sticker-item ne riusa le custom
// properties) ma con una differenza — qui non è "una forma o mix di tutte", è un
// sottoinsieme scelto a piacere (checkbox per ognuno in Impostazioni del Mondo): il valore
// salvato è "all", "none" (bottone "Tutte"/"Nessuna" in Impostazioni) oppure una lista di
// kind separati da virgola (vedi functions/api/world-settings.js, isValidStickerValue). Emoji
// invece di SVG disegnati a mano: Rory ha chiarito di andar bene anche così dopo averne discusso.
export function resolveStickerKinds(value: string | undefined): StickerKind[] {
  if (!value || value === 'all') return ALL_STICKER_KINDS;
  if (value === 'none') return [];
  const parsed = value.split(',').filter((part): part is StickerKind => ALL_STICKER_KINDS.includes(part as StickerKind));
  return parsed;
}

@Component({
  selector: 'app-world-stickers',
  standalone: true,
  templateUrl: './world-stickers.html'
})
export class WorldStickers {
  protected readonly worldSettingsService = inject(WorldSettingsService);

  protected readonly stickers = computed<Sticker[]>(() => {
    const kinds = resolveStickerKinds(this.worldSettingsService.values().stickers);
    if (kinds.length === 0) return [];
    return Array.from({ length: STICKER_COUNT }, (_, index) => this.createSticker(kinds[index % kinds.length]));
  });

  protected emoji(kind: StickerKind): string {
    return STICKER_EMOJI[kind];
  }

  private createSticker(kind: StickerKind): Sticker {
    const rotateStart = randomBetween(-20, 20);
    return {
      kind,
      x: Number(randomBetween(2, 98).toFixed(2)),
      size: Number(randomBetween(1.8, 3.4).toFixed(2)),
      opacity: Number(randomBetween(0.55, 0.9).toFixed(2)),
      sway: Number(randomBetween(10, 26).toFixed(1)),
      rotateStart: Number(rotateStart.toFixed(1)),
      rotateEnd: Number((rotateStart + randomBetween(40, 90) * (randomBetween(0, 1) > 0.5 ? 1 : -1)).toFixed(1)),
      fallDuration: Number(randomBetween(16, 30).toFixed(2)),
      fallDelay: Number(randomBetween(0, 22).toFixed(2))
    };
  }
}
