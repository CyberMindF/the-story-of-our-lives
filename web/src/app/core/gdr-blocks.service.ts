import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { GdrBlockRow, GdrBlockType, GdrDocumentKey } from '../shared/gdr-blocks/gdr-block.types';

// Centralizza le chiamate a /api/gdr-blocks usate dall'editor admin del GDR, prima sparse come
// fetch() grezzo dentro GdrDocumentEditor.
@Injectable({ providedIn: 'root' })
export class GdrBlocksService {
  private readonly api = inject(ApiService);

  async list(): Promise<GdrBlockRow[]> {
    const response = await fetch('/api/gdr-blocks', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Errore ${response.status}`);
    const result = await this.api.readApiResponse<{ blocks?: GdrBlockRow[] }>(response);
    return result.blocks ?? [];
  }

  async create(documentKey: GdrDocumentKey, type: GdrBlockType, data: unknown): Promise<boolean> {
    return this.api.sendAuthenticatedJson('/api/gdr-blocks', { documentKey, type, data }, 'POST');
  }

  async remove(id: string): Promise<boolean> {
    return this.api.sendAuthenticatedJson(`/api/gdr-blocks/${id}`, {}, 'DELETE');
  }
}
