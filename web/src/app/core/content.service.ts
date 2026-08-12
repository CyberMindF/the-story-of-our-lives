import { Injectable } from '@angular/core';

export interface ContentEntry {
  id: number;
  contentKey: string;
  label: string;
  contentType: 'plain_text' | 'paragraphs';
  versioningMode: 'replace' | 'history';
  body: string;
  updatedAt: string;
  versions?: { id: number; createdAt: string }[];
  versionId?: number;
  currentVersionId?: number | null;
  versionCreatedAt?: string;
}

export interface ContentSaveResult {
  contentKey: string;
  body: string;
  currentVersionId: number | null;
  updatedAt: string;
}

// Legge i contenuti editoriali del CMS (documentazione/cms/planning-editor-contenuti.md, Fase 4+) da
// content_entries/content_versions via API, sostituendo i testi finora hardcoded nei template.
@Injectable({ providedIn: 'root' })
export class ContentService {
  async load(contentKey: string, versionId?: number): Promise<ContentEntry> {
    const query = versionId ? `?versionId=${versionId}` : '';
    const response = await fetch(`/api/content/${contentKey}${query}`, {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin'
    });
    if (!response.ok) {
      throw new Error(`Caricamento contenuto fallito: ${response.status}`);
    }
    return (await response.json()) as ContentEntry;
  }

  // La risposta del PUT è volutamente minima (non un ContentEntry completo): il chiamante che
  // ha bisogno dell'elenco versioni aggiornato deve ricaricare con load().
  async save(contentKey: string, body: string, createVersion = false): Promise<ContentSaveResult> {
    const response = await fetch(`/api/content/${contentKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ body, createVersion })
    });
    if (!response.ok) {
      throw new Error(`Salvataggio contenuto fallito: ${response.status}`);
    }
    return (await response.json()) as ContentSaveResult;
  }
}
