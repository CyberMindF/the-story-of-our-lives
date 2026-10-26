import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  GdrWorkspaceService,
  InventoryItem,
  WorkspaceCharacter,
  CharacterProfile,
} from '../../core/gdr-workspace.service';
import {
  PROFILE_FIELDS,
  emptyProfile,
  parseCharacterBundle,
  exportCharacter,
  prepareCharacterImage,
} from './character-profile';
import { GdrTurn } from '../gdr-turn/gdr-turn';

@Component({
  selector: 'app-gdr-characters',
  standalone: true,
  imports: [FormsModule, GdrTurn],
  templateUrl: './gdr-characters.html',
  styleUrl: './gdr-characters.css',
})
export class GdrCharacters {
  protected readonly workspace = inject(GdrWorkspaceService);
  readonly inventoryOnly = input(false);
  readonly legacySheet = input('');
  readonly legacyName = input('Il mio personaggio');
  readonly legacyPortrait = input('');
  readonly legacyNpcs = input<{ name: string; portrait: string; description: string }[]>([]);
  protected readonly profileFields = PROFILE_FIELDS;
  protected readonly profile = signal<CharacterProfile>(emptyProfile());
  protected readonly photo = signal('');
  protected readonly mediaBusy = signal(false);
  protected readonly filter = signal<'all' | 'pg' | 'png'>('all');
  protected readonly search = signal('');
  protected readonly createOpen = signal(false);
  protected readonly importPreview = signal<ReturnType<typeof parseCharacterBundle> | null>(null);
  protected readonly roster = computed(() =>
    this.workspace
      .characters()
      .filter(
        (c) =>
          (this.filter() === 'all' || c.kind === this.filter()) &&
          (c.name + ' ' + (c.profile?.surname ?? ''))
            .toLocaleLowerCase('it')
            .includes(this.search().toLocaleLowerCase('it')),
      ),
  );
  protected readonly name = signal('');
  protected readonly portrait = signal('');
  protected readonly sheet = signal('');
  protected readonly items = signal<InventoryItem[]>([]);
  protected readonly newKind = signal<'pg' | 'png'>('pg');
  protected readonly newName = signal('');
  protected readonly userId = signal(0);
  protected readonly speak = signal(true);
  protected readonly editSheet = signal(false);
  protected readonly editInventory = signal(false);
  protected readonly editing = signal(false);
  protected readonly dirty = signal(false);
  protected readonly localError = signal('');
  private editingRevision = 0;
  private currentId = '';
  private createId = crypto.randomUUID();
  private editAfterCreateId = '';
  constructor() {
    effect(() => this.workspace.pendingChanges.set(this.dirty() || this.mediaBusy()));
    effect(() => {
      const c = this.workspace.active();
      if (
        c &&
        (c.id !== this.currentId || (!this.dirty() && c.revision !== this.editingRevision))
      ) {
        this.currentId = c.id;
        this.populate(c);
        if (this.editAfterCreateId === c.id) {
          this.editing.set(true);
          this.editAfterCreateId = '';
        }
      }
      if (!c) this.currentId = '';
    });
  }
  private populate(c: WorkspaceCharacter): void {
    this.profile.set({ ...emptyProfile(), ...c.profile });
    this.photo.set(c.photo ?? '');
    this.name.set(c.name);
    this.portrait.set(c.portrait);
    this.sheet.set(c.sheet);
    this.items.set(structuredClone(c.inventory));
    this.editingRevision = c.revision;
    this.dirty.set(false);
    this.editing.set(false);
  }
  protected choose(id: string): void {
    if (this.dirty() || this.mediaBusy()) {
      this.localError.set('Salva o annulla le modifiche prima di cambiare personaggio.');
      return;
    }
    this.localError.set('');
    this.workspace.activeId.set(id);
    this.userId.set(0);
  }
  protected discard(): void {
    const c = this.workspace.active();
    if (c) this.populate(c);
    this.localError.set('');
  }
  protected changeItem(
    id: string,
    key: 'name' | 'quantity' | 'notes',
    value: string | number,
  ): void {
    this.items.update((items) => items.map((i) => (i.id === id ? { ...i, [key]: value } : i)));
    this.dirty.set(true);
  }
  protected addItem(): void {
    this.items.update((items) => [
      ...items,
      { id: crypto.randomUUID(), name: '', quantity: 1, notes: '' },
    ]);
    this.dirty.set(true);
  }
  protected removeItem(id: string): void {
    this.items.update((items) => items.filter((i) => i.id !== id));
    this.dirty.set(true);
  }
  protected async saveInventory(): Promise<void> {
    const c = this.workspace.active();
    if (!c) return;
    if (
      await this.workspace.save({
        action: 'inventory',
        characterId: c.id,
        revision: this.editingRevision,
        items: this.items(),
      })
    ) {
      const next = this.workspace.active();
      if (next) this.populate(next);
    }
  }
  protected async saveSheet(): Promise<void> {
    const c = this.workspace.active();
    if (!c) return;
    if (
      await this.workspace.save({
        action: 'saveCharacter',
        characterId: c.id,
        revision: this.editingRevision,
        name: this.name(),
        portrait: this.portrait(),
        photo: this.photo(),
        profile: this.profile(),
        sheet: this.sheet(),
      })
    ) {
      const next = this.workspace.active();
      if (next) this.populate(next);
    }
  }
  protected async create(copy = false): Promise<void> {
    const id = this.createId;
    this.editAfterCreateId = id;
    if (
      await this.workspace.save({
        action: 'createCharacter',
        id,
        adventureId: this.workspace.selectedId(),
        kind: copy ? 'pg' : this.newKind(),
        name: copy ? this.legacyName() : this.newName(),
        portrait: copy ? this.legacyPortrait() : '',
        sheet: copy ? this.legacySheet() : '',
      })
    ) {
      this.createId = crypto.randomUUID();
      this.workspace.activeId.set(id);
      this.newName.set('');
      this.createOpen.set(false);
    }
  }
  protected changeProfile(key: keyof CharacterProfile, value: string): void {
    this.profile.update((p) => ({ ...p, [key]: value }));
    this.dirty.set(true);
  }
  protected async upload(event: Event, slot: 'photo' | 'avatar'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    const c = this.workspace.active();
    if (!file || !c) return;
    this.mediaBusy.set(true);
    this.localError.set('');
    try {
      const data = await prepareCharacterImage(file, slot === 'avatar');
      const path = await this.workspace.upload(c.id, slot, data);
      if (slot === 'photo') {
        this.photo.set(path);
        this.dirty.set(true);
        if (!this.portrait())
          this.portrait.set(
            await this.workspace.upload(c.id, 'avatar', await prepareCharacterImage(file, true)),
          );
      } else {
        this.portrait.set(path);
        this.dirty.set(true);
      }
    } catch (error) {
      this.localError.set(error instanceof Error ? error.message : 'Caricamento non riuscito.');
    } finally {
      this.mediaBusy.set(false);
    }
  }
  protected async avatarFromPhoto(): Promise<void> {
    const c = this.workspace.active();
    if (!c || !this.photo()) return;
    this.mediaBusy.set(true);
    this.localError.set('');
    try {
      const response = await fetch(this.photo(), { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Foto non disponibile.');
      this.portrait.set(
        await this.workspace.upload(
          c.id,
          'avatar',
          await prepareCharacterImage(await response.blob(), true),
        ),
      );
      this.dirty.set(true);
    } catch (error) {
      this.localError.set(error instanceof Error ? error.message : 'Avatar non riuscito.');
    } finally {
      this.mediaBusy.set(false);
    }
  }
  protected async export(): Promise<void> {
    const c = this.workspace.active();
    if (!c) return;
    this.mediaBusy.set(true);
    this.localError.set('');
    try {
      const bundle = await exportCharacter(c);
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = (c.name.replace(/[^a-zA-Z0-9_-]/g, '-') || 'personaggio') + '.personaggio.json';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      this.localError.set(error instanceof Error ? error.message : 'Esportazione non riuscita.');
    } finally {
      this.mediaBusy.set(false);
    }
  }
  protected async inspectImport(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.localError.set('');
    this.importPreview.set(null);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Il file è troppo grande.');
      this.importPreview.set(parseCharacterBundle(await file.text()));
    } catch (error) {
      this.localError.set(error instanceof Error ? error.message : 'Importazione non valida.');
    }
  }
  protected async importCharacter(): Promise<void> {
    const bundle = this.importPreview();
    if (!bundle) return;
    const id = this.createId;
    if (
      !(await this.workspace.save({
        action: 'createCharacter',
        id,
        adventureId: this.workspace.selectedId(),
        kind: bundle.kind,
        name: bundle.name,
        profile: bundle.profile,
        sheet: bundle.sheet,
        items: bundle.inventory,
      }))
    )
      return;
    this.createId = crypto.randomUUID();
    this.workspace.activeId.set(id);
    this.importPreview.set(null);
    this.mediaBusy.set(true);
    this.localError.set('');
    try {
      const upload = async (value: string, slot: 'photo' | 'avatar') =>
        value
          ? this.workspace.upload(
              id,
              slot,
              await prepareCharacterImage(await (await fetch(value)).blob(), slot === 'avatar'),
            )
          : '';
      const photo = await upload(bundle.images.photo, 'photo');
      const portrait = await upload(bundle.images.avatar, 'avatar');
      const c = this.workspace.characters().find((c) => c.id === id)!;
      if (photo || portrait)
        await this.workspace.save({
          action: 'saveCharacter',
          characterId: id,
          revision: c.revision,
          name: c.name,
          sheet: c.sheet,
          profile: c.profile,
          photo,
          portrait,
        });
    } catch (error) {
      this.localError.set(
        'Personaggio importato, ma le immagini non sono state completate. Puoi ricaricarle dalla scheda. ' +
          (error instanceof Error ? error.message : ''),
      );
    } finally {
      this.mediaBusy.set(false);
    }
  }
  protected async copyNpc(npc: {
    name: string;
    portrait: string;
    description: string;
  }): Promise<void> {
    const id = this.createId;
    if (
      await this.workspace.save({
        action: 'createCharacter',
        id,
        adventureId: this.workspace.selectedId(),
        kind: 'png',
        name: npc.name,
        portrait: npc.portrait,
        photo: npc.portrait,
        profile: { ...emptyProfile(), appearance: npc.description },
        sheet: '',
      })
    ) {
      this.createId = crypto.randomUUID();
      this.workspace.activeId.set(id);
    }
  }
  protected setUser(id: number): void {
    this.userId.set(id);
    const c = this.workspace.active();
    const grant = this.workspace.grants().find((g) => g.characterId === c?.id && g.userId === id);
    this.speak.set(grant?.canSpeak ?? true);
    this.editSheet.set(grant?.canEditSheet ?? false);
    this.editInventory.set(grant?.canInventory ?? false);
  }
  protected async grant(): Promise<void> {
    const c = this.workspace.active();
    if (!c) return;
    if (
      await this.workspace.save({
        action: 'grant',
        characterId: c.id,
        revision: c.revision,
        userId: this.userId(),
        canSpeak: this.speak(),
        canEditSheet: c.kind === 'pg' && this.editSheet(),
        canInventory: this.editInventory(),
      })
    ) {
      const next = this.workspace.active();
      if (next && !this.dirty()) this.populate(next);
    }
  }
  protected async archive(): Promise<void> {
    const c = this.workspace.active();
    if (!c) return;
    await this.workspace.save({
      action: 'archive',
      characterId: c.id,
      revision: c.revision,
      archived: !c.archived,
    });
  }
}
