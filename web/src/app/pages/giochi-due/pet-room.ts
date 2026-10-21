import { Component, OnDestroy, computed, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { PetSprite } from './pet-sprite';

interface Proposal { id: string; name: string; by: string; userId: number; }
export interface Pet {
  id: string; name: string; species: string | null; egg: boolean; surprise: boolean; incubation: string[]; xp: number;
  proposals: Record<string, Proposal>; discoveries: string[]; favoriteToy: string | null; favoriteFood: string | null; myCare: string[];
}
interface ShopItem { id: string; name: string; emoji: string; price: number; type: string; description: string; }
export interface PetView {
  pets?: Pet[]; coins?: number; owned?: string[]; food?: Record<string, number>; placed?: Record<string, string | null>; decor?: string;
  nextEggXp?: number; eggPrice?: number; totalXp?: number;
  species?: { id: string; name: string; emoji: string }[]; shop?: ShopItem[];
  events?: { id: string; actor: string; text: string; type: string; reaction: string; petId: string | null; at: number }[];
  memory?: { id: string; petId: string; board: (string | null)[]; matched: number[]; open: number[]; turns: number; done: boolean; reward: number } | null;
}
@Component({ selector: 'app-pet-room', imports: [FormsModule, DatePipe, PetSprite], templateUrl: './pet-room.html', styleUrl: './pet-room.css' })
export class PetRoom implements OnDestroy {
  readonly state = input.required<PetView>();
  readonly busy = input(false);
  readonly userId = input(0);
  readonly command = output<Record<string, unknown> & { type: string }>();
  protected readonly tab = signal<'room' | 'shop' | 'memory' | 'adopt'>('room');
  protected readonly selected = signal('');
  protected readonly pet = computed(() => this.state().pets?.find(p => p.id === this.selected()) ?? this.state().pets?.[0]);
  protected readonly name = signal('');
  protected readonly adoption = signal('surprise');
  protected readonly reaction = signal('');
  protected readonly flipLocked = signal(false);
  protected readonly scale = computed(() => this.pet()?.egg ? .85 : .65 + .35 * Math.min(1, (this.pet()?.xp ?? 0) / 18));
  protected readonly proposals = computed(() => Object.values(this.pet()?.proposals ?? {}));
  protected readonly inventory = computed(() => this.state().shop?.filter(i => this.state().owned?.includes(i.id)) ?? []);
  protected readonly placed = computed(() => ['left', 'right'].map(side => ({ side, item: this.state().shop?.find(i => i.id === this.state().placed?.[side]) })).filter(entry => entry.item));
  protected readonly snacks = computed(() => this.state().shop?.filter(i => i.type === 'food' && (this.state().food?.[i.id] ?? 0) > 0) ?? []);
  protected readonly canAdopt = computed(() => !(this.state().pets ?? []).some(p => p.egg) && (this.state().pets?.length ?? 0) < 12
    && (this.state().totalXp ?? 0) >= (this.state().nextEggXp ?? 0) && (this.state().coins ?? 0) >= (this.state().eggPrice ?? 0));
  protected readonly careActions = [{ id: 'coccola', emoji: '🥰', label: 'Coccola' }, { id: 'snack', emoji: '🥣', label: 'Pappa' }, { id: 'gioca', emoji: '🖐️', label: 'Gioca' }];
  protected readonly eggActions = [{ id: 'warm', emoji: '🧣', label: 'Tienilo al caldo' }, { id: 'turn', emoji: '🥚', label: 'Giralo piano' }, { id: 'listen', emoji: '👂', label: 'Ascolta' }];
  private timer?: ReturnType<typeof setTimeout>;
  private flipTimer?: ReturnType<typeof setTimeout>;
  private lastEvent = '';
  private lastPet = '';
  constructor() {
    effect(() => {
      const pet = this.pet();
      if (pet?.id !== this.lastPet) {
        this.lastPet = pet?.id ?? ''; this.name.set(''); this.reaction.set(''); clearTimeout(this.timer);
      }
      const event = this.state().events?.[0];
      if (event?.id && event.id !== this.lastEvent) {
        if (this.lastEvent && event.petId === pet?.id) {
          this.reaction.set(event.reaction || event.type); clearTimeout(this.timer);
          this.timer = setTimeout(() => this.reaction.set(''), 2200);
        }
        this.lastEvent = event.id;
      }
    });
  }
  protected send(type: string, extra: Record<string, unknown> = {}): void {
    if (!this.busy()) this.command.emit({ type, petId: this.pet()?.id, ...extra });
  }
  protected emoji(pet: Pet): string { return pet.egg ? '🥚' : this.state().species?.find(s => s.id === pet.species)?.emoji ?? '🐾'; }
  protected speciesName(id: string | null): string { return this.state().species?.find(s => s.id === id)?.name.toLowerCase() ?? 'animale'; }
  protected itemName(id: string | null): string { return this.state().shop?.find(i => i.id === id)?.name ?? 'Da scoprire'; }
  protected memoryPet(): string { return this.state().pets?.find(p => p.id === this.state().memory?.petId)?.name ?? ''; }
  protected flip(cell: number): void {
    if (this.flipLocked() || this.busy()) return;
    this.send('memory-flip', { runId: this.state().memory?.id, cell });
    this.flipLocked.set(true); clearTimeout(this.flipTimer);
    this.flipTimer = setTimeout(() => this.flipLocked.set(false), 1000);
  }
  ngOnDestroy(): void { clearTimeout(this.timer); clearTimeout(this.flipTimer); }
}
