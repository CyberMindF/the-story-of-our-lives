import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StaticContentService {
  async load<T>(url: `/content/${string}.json`): Promise<T> {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Caricamento fallito: ${response.status}`);
    }
    return (await response.json()) as T;
  }
}
