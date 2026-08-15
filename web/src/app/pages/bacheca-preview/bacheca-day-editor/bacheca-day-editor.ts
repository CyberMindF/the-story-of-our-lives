import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioPlayer } from '../../../shared/audio-player/audio-player';
import { ConfirmationDialog } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { Block, Column, DayContent, Row } from '../bacheca.types';

type RowPreset = 'full' | 'two' | 'three' | 'photo-text' | 'text-photo';
type BlockType = Block['type'];

interface BlockFormState {
  type: BlockType;
  text: string;
  linkHref: string;
  linkLabel: string;
  key: string;
  thumbKey: string;
  caption: string;
  label: string;
  vertical: boolean;
  href: string;
  // #e14bis: data facoltativa del singolo blocco (YYYY-MM-DD), comune a tutti i tipi.
  memoryDate: string;
}

interface BlockTarget {
  rowIndex: number;
  colIndex: number;
  blockIndex: number | null;
}

function emptyBlockForm(type: BlockType = 'text'): BlockFormState {
  return { type, text: '', linkHref: '', linkLabel: '', key: '', thumbKey: '', caption: '', label: '', vertical: false, href: '', memoryDate: '' };
}

function blockToForm(block: Block): BlockFormState {
  const form = emptyBlockForm(block.type);
  form.memoryDate = block.memoryDate ?? '';
  if (block.type === 'text') {
    form.text = block.text;
    form.linkHref = block.link?.href ?? '';
    form.linkLabel = block.link?.label ?? '';
  } else if (block.type === 'photo') {
    form.key = block.key;
    form.thumbKey = block.thumbKey ?? '';
    form.caption = block.caption ?? '';
  } else if (block.type === 'link') {
    form.href = block.href;
    form.caption = block.caption ?? '';
  } else {
    form.key = block.key;
    form.label = block.label ?? '';
    form.vertical = block.vertical ?? false;
  }
  return form;
}

function formToBlock(form: BlockFormState): Block | null {
  const block = buildBlockFromForm(form);
  if (block && form.memoryDate.trim()) {
    block.memoryDate = form.memoryDate.trim();
  }
  return block;
}

function buildBlockFromForm(form: BlockFormState): Block | null {
  switch (form.type) {
    case 'text': {
      const text = form.text.trim();
      if (!text) return null;
      const block: Block = { type: 'text', text };
      if (form.linkHref.trim() && form.linkLabel.trim()) {
        block.link = { href: form.linkHref.trim(), label: form.linkLabel.trim() };
      }
      return block;
    }
    case 'photo': {
      const key = form.key.trim();
      if (!key) return null;
      const block: Block = { type: 'photo', key };
      if (form.thumbKey.trim()) block.thumbKey = form.thumbKey.trim();
      if (form.caption.trim()) block.caption = form.caption.trim();
      return block;
    }
    case 'link': {
      const href = form.href.trim();
      if (!href) return null;
      const block: Block = { type: 'link', href };
      if (form.caption.trim()) block.caption = form.caption.trim();
      return block;
    }
    case 'video':
    case 'audio': {
      const key = form.key.trim();
      if (!key) return null;
      const block: Block = { type: form.type, key };
      if (form.label.trim()) block.label = form.label.trim();
      if (form.type === 'video' && form.vertical) block.vertical = true;
      return block;
    }
  }
}

const THUMBNAIL_MAX_WIDTH = 480;

// Ridimensiona una foto lato browser per generare la miniatura: Cloudflare Workers non può
// eseguire una libreria di resize nativa (sharp e simili sono binari, non funzionano nel
// runtime dei Workers), quindi il ridimensionamento avviene qui prima dell'upload.
async function createThumbnail(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, THUMBNAIL_MAX_WIDTH / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponibile.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('Impossibile generare la miniatura.'))), 'image/jpeg', 0.78);
  });
  return new File([blob], 'thumb.jpg', { type: 'image/jpeg' });
}

function createRow(preset: RowPreset): Row {
  if (preset === 'full') return { columns: [{ width: 1, blocks: [] }] };
  if (preset === 'three') return { columns: [{ width: 1 / 3, blocks: [] }, { width: 1 / 3, blocks: [] }, { width: 1 / 3, blocks: [] }] };
  // 'two', 'photo-text' e 'text-photo' producono la stessa struttura (due colonne uguali):
  // i due preset con nome diverso esistono solo per farli riconoscere subito nel picker,
  // niente proprietà salvata in più — la scelta del blocco resta comunque libera dopo.
  return { columns: [{ width: 0.5, blocks: [] }, { width: 0.5, blocks: [] }] };
}

// Editor visuale di un giorno della Bacheca (opzione D concordata il 12/08/2026): mostra i
// blocchi reali (non JSON) con controlli semplici — aggiungi/modifica/elimina, frecce per le
// correzioni vicine, "Sposta…" per i salti lunghi. Tutta la modifica avviene su una copia in
// memoria; "Salva" invia l'intero content del giorno in un colpo solo (validato rigorosamente
// dal backend), "Annulla" scarta tutto senza toccare il server.
@Component({
  selector: 'app-bacheca-day-editor',
  standalone: true,
  imports: [FormsModule, AudioPlayer, ConfirmationDialog],
  styleUrls: ['./bacheca-day-editor.css'],
  templateUrl: './bacheca-day-editor.html'
})
export class BachecaDayEditor {
  @Input({ required: true }) set content(value: DayContent) {
    this.draft.set(structuredClone(value));
  }
  @Output() save = new EventEmitter<DayContent>();
  @Output() cancelled = new EventEmitter<void>();

  protected readonly draft = signal<DayContent>({ rows: [] });
  protected readonly saveError = signal('');

  protected readonly addingRow = signal(false);

  protected readonly blockTarget = signal<BlockTarget | null>(null);
  protected readonly blockForm = signal<BlockFormState>(emptyBlockForm());
  protected readonly blockFormError = signal('');
  protected readonly uploading = signal(false);
  protected readonly uploadError = signal('');

  protected readonly rowMoveTarget = signal<number | null>(null);
  protected readonly rowMoveAfter = signal<string>('');

  protected readonly deleteRowTarget = signal<number | null>(null);
  protected readonly deleteBlockTarget = signal<BlockTarget | null>(null);

  protected readonly hasEmptyColumns = computed(() =>
    this.draft().rows.some((row) => row.columns.some((col) => col.blocks.length === 0))
  );

  protected mediaUrl(key: string): string {
    return `/api/media/${key}`;
  }

  // -------------------- Righe --------------------

  protected startAddRow(): void {
    this.addingRow.set(true);
  }

  protected cancelAddRow(): void {
    this.addingRow.set(false);
  }

  protected addRow(preset: RowPreset): void {
    const current = this.draft();
    this.draft.set({ rows: [...current.rows, createRow(preset)] });
    this.addingRow.set(false);
  }

  protected requestDeleteRow(rowIndex: number): void {
    this.deleteRowTarget.set(rowIndex);
  }

  protected cancelDeleteRow(): void {
    this.deleteRowTarget.set(null);
  }

  protected confirmDeleteRow(): void {
    const index = this.deleteRowTarget();
    if (index === null) return;
    const rows = [...this.draft().rows];
    rows.splice(index, 1);
    this.draft.set({ rows });
    this.deleteRowTarget.set(null);
  }

  protected moveRow(rowIndex: number, direction: 'up' | 'down'): void {
    const rows = [...this.draft().rows];
    const targetIndex = direction === 'up' ? rowIndex - 1 : rowIndex + 1;
    if (targetIndex < 0 || targetIndex >= rows.length) return;
    [rows[rowIndex], rows[targetIndex]] = [rows[targetIndex], rows[rowIndex]];
    this.draft.set({ rows });
  }

  protected startMoveRow(rowIndex: number): void {
    this.rowMoveTarget.set(rowIndex);
    this.rowMoveAfter.set('');
  }

  protected cancelMoveRow(): void {
    this.rowMoveTarget.set(null);
  }

  protected otherRowIndexes(): number[] {
    const target = this.rowMoveTarget();
    if (target === null) return [];
    return this.draft().rows.map((_, index) => index).filter((index) => index !== target);
  }

  protected confirmMoveRow(): void {
    const from = this.rowMoveTarget();
    if (from === null) return;
    const rows = [...this.draft().rows];
    const [row] = rows.splice(from, 1);
    const afterValue = this.rowMoveAfter();
    const afterIndex = afterValue === '' ? -1 : Number(afterValue) - (Number(afterValue) > from ? 1 : 0);
    rows.splice(afterIndex + 1, 0, row);
    this.draft.set({ rows });
    this.rowMoveTarget.set(null);
  }

  // -------------------- Blocchi --------------------

  protected startAddBlock(rowIndex: number, colIndex: number): void {
    this.blockTarget.set({ rowIndex, colIndex, blockIndex: null });
    this.blockForm.set(emptyBlockForm());
    this.blockFormError.set('');
  }

  protected startEditBlock(rowIndex: number, colIndex: number, blockIndex: number, block: Block): void {
    this.blockTarget.set({ rowIndex, colIndex, blockIndex });
    this.blockForm.set(blockToForm(block));
    this.blockFormError.set('');
  }

  protected cancelBlockForm(): void {
    this.blockTarget.set(null);
  }

  // Carica il file scelto verso R2 (Fase 4, opzione D): la chiave viene generata dal server,
  // non va mai scritta a mano. Per le foto genera anche la miniatura lato browser prima di
  // inviarla. Il file originale non viene mai eliminato automaticamente quando un blocco
  // viene rimosso (solo il riferimento sparisce dal layout), per non rischiare perdite.
  protected async uploadFile(event: Event, mediaType: 'photo' | 'video' | 'audio'): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.uploadError.set('');
    try {
      const result = await this.uploadBlob(file, mediaType);
      if (!result.key) {
        this.uploadError.set(result.error || 'Upload non riuscito.');
        return;
      }
      let thumbKey: string | undefined;
      if (mediaType === 'photo') {
        const thumbnailResult = await this.uploadBlob(await createThumbnail(file), 'thumbnail');
        if (!thumbnailResult.key) {
          this.uploadError.set(thumbnailResult.error || 'La foto è stata caricata, ma la miniatura no. Riprova selezionando di nuovo il file.');
          return;
        }
        thumbKey = thumbnailResult.key;
      }

      this.updateBlockForm({ key: result.key, ...(thumbKey ? { thumbKey } : {}) });
    } catch (error) {
      console.error('Errore durante il caricamento:', error);
      this.uploadError.set('Upload non riuscito. Controlla la connessione e riprova.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  private async uploadBlob(blob: Blob, mediaType: 'photo' | 'video' | 'audio' | 'thumbnail'):
    Promise<{ key?: string; error?: string }> {
    const response = await fetch(`/api/bacheca-media/upload?type=${mediaType}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': blob.type },
      body: blob
    });
    const result = (await response.json().catch(() => ({}))) as { key?: string; error?: string };
    return response.ok ? result : { error: result.error || 'Upload non riuscito.' };
  }

  protected updateBlockForm(patch: Partial<BlockFormState>): void {
    this.blockForm.set({ ...this.blockForm(), ...patch });
  }

  protected submitBlockForm(): void {
    const target = this.blockTarget();
    if (!target) return;
    const block = formToBlock(this.blockForm());
    if (!block) {
      this.blockFormError.set('Compila i campi obbligatori per questo tipo di blocco.');
      return;
    }

    const rows = structuredClone(this.draft().rows);
    const blocks = rows[target.rowIndex].columns[target.colIndex].blocks;
    if (target.blockIndex === null) {
      blocks.push(block);
    } else {
      blocks[target.blockIndex] = block;
    }
    this.draft.set({ rows });
    this.blockTarget.set(null);
  }

  protected requestDeleteBlock(rowIndex: number, colIndex: number, blockIndex: number): void {
    this.deleteBlockTarget.set({ rowIndex, colIndex, blockIndex });
  }

  protected cancelDeleteBlock(): void {
    this.deleteBlockTarget.set(null);
  }

  protected confirmDeleteBlock(): void {
    const target = this.deleteBlockTarget();
    if (!target || target.blockIndex === null) return;
    const rows = structuredClone(this.draft().rows);
    rows[target.rowIndex].columns[target.colIndex].blocks.splice(target.blockIndex, 1);
    this.draft.set({ rows });
    this.deleteBlockTarget.set(null);
  }

  protected moveBlock(rowIndex: number, colIndex: number, blockIndex: number, direction: 'up' | 'down'): void {
    const rows = structuredClone(this.draft().rows);
    const blocks = rows[rowIndex].columns[colIndex].blocks;
    const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [blocks[blockIndex], blocks[targetIndex]] = [blocks[targetIndex], blocks[blockIndex]];
    this.draft.set({ rows });
  }

  // -------------------- Salvataggio --------------------

  protected submit(): void {
    if (this.hasEmptyColumns()) {
      this.saveError.set('Ogni colonna deve avere almeno un blocco prima di salvare.');
      return;
    }
    this.saveError.set('');
    this.save.emit(this.draft());
  }

  protected cancel(): void {
    this.cancelled.emit();
  }

  protected summary(block: Block): string {
    if (block.type === 'text') return block.text.slice(0, 70);
    if (block.type === 'photo') return block.caption || block.key;
    if (block.type === 'link') return block.caption || block.href;
    return block.label || block.key;
  }
}
