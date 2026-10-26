import { Component, ElementRef, ViewChild, computed, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GdrBlocks } from '../gdr-blocks/gdr-blocks';
import { parseNarrative } from './gdr-turn.parser';

@Component({
  selector: 'app-gdr-turn',
  standalone: true,
  imports: [GdrBlocks, FormsModule, NgTemplateOutlet],
  template: `
    @for (section of parsed().sections; track section.id; let sectionIndex = $index) {
      @if (section.kind === 'document' && editable()) {
        @for (block of section.blocks; track block.id; let i = $index) {
          @if (isEditing(section.ranges[i])) {
            <ng-container *ngTemplateOutlet="inlineEditor" />
          } @else {
            <app-gdr-blocks
              [blocks]="[block]"
              [editable]="true"
              [continuation]="i > 0 || sectionIndex > 0"
              (editBlock)="startEditing(section.ranges[i])"
            />
          }
        }
      } @else {
        @if (isEditing(section)) {
          <ng-container *ngTemplateOutlet="inlineEditor" />
        } @else {
          <ng-container
            *ngTemplateOutlet="content; context: { $implicit: section, canEdit: editable() }"
          />
        }
      }
    }
    <ng-template #inlineEditor>
      <section class="inline-editor" aria-label="Modifica in questo punto">
        <div class="inline-header">
          <strong>Modifica questo punto</strong><span>Solo questa parte del racconto.</span>
        </div>
        <label class="sr-only" [for]="fieldId">Testo del blocco selezionato</label>
        <textarea
          #inlineArea
          [id]="fieldId"
          rows="7"
          [ngModel]="draft()"
          (ngModelChange)="draft.set($event)"
          spellcheck="true"
        ></textarea>
        @if (message()) {
          <p class="inline-message" role="status">{{ message() }}</p>
        }
        <div class="inline-actions">
          <button type="button" (click)="apply()">Applica al testo</button
          ><button type="button" (click)="cancel()">Annulla modifica rapida</button
          ><button type="button" [attr.aria-pressed]="preview()" (click)="preview.set(!preview())">
            Anteprima di questa parte
          </button>
        </div>
        @if (preview()) {
          <div class="inline-preview">
            @for (section of draftParsed().sections; track section.id) {
              <ng-container
                *ngTemplateOutlet="content; context: { $implicit: section, canEdit: false }"
              />
            }
          </div>
        }
      </section>
    </ng-template>
    <ng-template #content let-section let-canEdit="canEdit">
      @switch (section.kind) {
        @case ('document') {
          <app-gdr-blocks [blocks]="section.blocks" />
        }
        @case ('dialogo') {
          <div class="dialogue">
            <div class="speaker">
              @if (section.portrait) {
                <img [src]="section.portrait" alt="" loading="lazy" />
              } @else {
                <span class="initial" aria-hidden="true">{{
                  section.speaker.slice(0, 1) || '?'
                }}</span>
              }
              @if (canEdit) {
                <button type="button" class="edit-speaker" (click)="startEditing(section)">
                  {{ section.speaker || 'Personaggio' }} <span aria-hidden="true">✎</span>
                </button>
              } @else {
                <strong>{{ section.speaker || 'Personaggio' }}</strong>
              }
            </div>
            <p>{{ section.text }}</p>
          </div>
        }
        @case ('azione') {
          @if (canEdit) {
            <button type="button" class="edit-start" (click)="startEditing(section)">
              ✎ Modifica azione
            </button>
          }
          <p class="action">{{ section.text }}</p>
        }
        @case ('nota') {
          @if (canEdit) {
            <button type="button" class="edit-start" (click)="startEditing(section)">
              ✎ Modifica nota
            </button>
          }
          <p class="note"><small>Fuori personaggio</small>{{ section.text }}</p>
        }
      }
    </ng-template>
  `,
  styles: `
    :host {
      display: block;
      overflow-wrap: anywhere;
    }
    .dialogue {
      margin: 1.5rem 0;
    }
    .speaker {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      color: var(--accent-color);
      font-size: 0.9rem;
    }
    .speaker img,
    .initial {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      flex: none;
    }
    .initial {
      display: grid;
      place-items: center;
      background: var(--input-bg);
    }
    p {
      white-space: pre-wrap;
      line-height: 1.8;
      margin: 0.6rem 0 1.2rem;
    }
    .dialogue p {
      margin-left: calc(40px + 0.7rem);
    }
    .action {
      font-style: italic;
    }
    .note {
      color: var(--muted-color);
      font-size: 0.9rem;
    }
    .note small {
      display: block;
      font-weight: 600;
      margin-bottom: 0.3rem;
    }
    .edit-speaker,
    .edit-start {
      border: 0;
      background: transparent;
      color: var(--accent-color);
      font: inherit;
      text-align: left;
      cursor: pointer;
      padding: 0;
    }
    .edit-speaker {
      font-weight: 600;
    }
    .edit-start {
      font-size: 0.75rem;
    }
    .inline-editor {
      border: 1px solid var(--accent-color);
      border-radius: 8px;
      background: var(--input-bg);
      margin: 1rem 0;
      overflow: hidden;
    }
    .inline-header {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem 1rem;
      padding: 0.7rem 0.8rem;
      border-bottom: 1px solid var(--border-color);
      font-size: 0.85rem;
    }
    .inline-header span {
      font-size: 0.8rem;
      color: var(--muted-color);
    }
    textarea {
      display: block;
      width: 100%;
      box-sizing: border-box;
      min-height: 160px;
      resize: vertical;
      border: 0;
      background: var(--input-bg);
      padding: 0.8rem;
      color: var(--text-color);
      font: inherit;
      font-family: ui-monospace, monospace;
      font-size: 0.86rem;
      line-height: 1.7;
    }
    .inline-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.6rem 0.7rem;
      border-top: 1px solid var(--border-color);
    }
    .inline-actions button {
      border: 1px solid var(--border-color);
      background: var(--button-bg);
      border-radius: 5px;
      color: var(--text-color);
      font: inherit;
      font-size: 0.8rem;
      min-height: 36px;
      padding: 0.35rem 0.6rem;
      cursor: pointer;
    }
    .inline-actions button:first-child {
      color: var(--accent-color);
    }
    .inline-preview {
      padding: 0.9rem;
      border-top: 1px solid var(--border-color);
      background: var(--panel-color);
    }
    .inline-message {
      font-size: 0.8rem;
      color: var(--danger-text-color);
      padding: 0 0.8rem;
    }
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
    }
    button:focus-visible,
    textarea:focus-visible {
      outline: 2px solid var(--focus-color);
      outline-offset: -2px;
    }
  `,
})
export class GdrTurn {
  readonly source = input.required<string>();
  readonly editable = input(false);
  readonly sourceChange = output<string>();
  readonly editingChange = output<boolean>();
  @ViewChild('inlineArea') private area?: ElementRef<HTMLTextAreaElement>;
  protected readonly fieldId = 'inline-' + crypto.randomUUID();
  protected readonly parsed = computed(() => parseNarrative(this.source()));
  protected readonly draft = signal('');
  protected readonly draftParsed = computed(() => parseNarrative(this.draft()));
  protected readonly preview = signal(false);
  protected readonly message = signal('');
  private readonly editing = signal<{ start: number; end: number; snapshot: string } | null>(null);
  protected isEditing(range: { start: number; end: number }): boolean {
    const current = this.editing();
    return !!current && current.start === range.start && current.end === range.end;
  }
  public startEditing(range: { start: number; end: number }): void {
    if (!this.editable() || !range) return;
    if (this.editing()) {
      this.message.set('Applica o annulla questa modifica prima di aprirne un’altra.');
      return;
    }
    this.editing.set({ ...range, snapshot: this.source() });
    this.draft.set(this.source().slice(range.start, range.end));
    this.preview.set(false);
    this.message.set('');
    this.editingChange.emit(true);
    requestAnimationFrame(() => this.area?.nativeElement.focus({ preventScroll: true }));
  }
  protected apply(): void {
    const current = this.editing();
    if (!current) return;
    if (current.snapshot !== this.source()) {
      this.message.set(
        'Il documento è cambiato. Copia la modifica, annulla e riapri questo punto.',
      );
      return;
    }
    this.sourceChange.emit(
      current.snapshot.slice(0, current.start) + this.draft() + current.snapshot.slice(current.end),
    );
    this.cancel();
  }
  protected cancel(): void {
    this.editing.set(null);
    this.editingChange.emit(false);
    this.message.set('');
  }
}
