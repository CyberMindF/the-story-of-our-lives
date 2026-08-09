import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Portone } from './portone/portone';

// Struttura route: '/' è il Portone (pathMatch 'full' essenziale — senza, matcherebbe come
// prefisso anche le route protette sotto, impedendo loro di attivarsi). Le pagine protette
// stanno sotto un gruppo con un'unica guardia condivisa (authGuard) ma NESSUN componente
// shell in comune: ogni pagina include <app-shell> con i propri @Input (vedi
// pages/mondo-bianco), replicando come nell'originale ogni pagina generasse la propria shell
// completa invece di condividerne una sola tra tutte le navigazioni.
//
// loadComponent (lazy) invece di component (eager) per tutte le pagine protette: con ~17
// pagine da migrare in totale (cruciverba compreso, il pezzo più grande) un bundle iniziale
// unico sarebbe cresciuto senza controllo. Il Portone resta eager: è la prima cosa che
// chiunque vede, niente da guadagnare a caricarlo pigro.
export const routes: Routes = [
  { path: '', pathMatch: 'full', component: Portone, data: { bodyClasses: ['access-locked', 'portone-page'] } },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'mondo-bianco',
        data: { bodyClasses: ['world-page'] },
        loadComponent: () => import('./pages/mondo-bianco/mondo-bianco').then((m) => m.MondoBianco)
      },
      {
        path: 'ponti',
        data: { bodyClasses: ['ponti-page'] },
        loadComponent: () => import('./pages/ponti/ponti').then((m) => m.Ponti)
      },
      {
        path: 'calendario',
        data: { bodyClasses: ['calendar-page'] },
        loadComponent: () => import('./pages/calendario/calendario').then((m) => m.Calendario)
      },
      {
        path: 'cuffiette',
        data: { bodyClasses: ['music-page'] },
        loadComponent: () => import('./pages/cuffiette/cuffiette').then((m) => m.Cuffiette)
      },
      {
        path: 'suggerimenti',
        data: { bodyClasses: ['suggerimenti-page'] },
        loadComponent: () => import('./pages/suggerimenti/suggerimenti').then((m) => m.Suggerimenti)
      },
      {
        path: 'storie',
        data: { bodyClasses: ['stories-page'] },
        loadComponent: () => import('./pages/storie/storie').then((m) => m.Storie)
      },
      {
        path: 'mappa',
        data: { bodyClasses: ['map-page'] },
        loadComponent: () => import('./pages/mappa/mappa').then((m) => m.Mappa)
      },
      {
        path: 'mappamondo',
        data: { bodyClasses: ['globe-page'] },
        loadComponent: () => import('./pages/mappamondo/mappamondo').then((m) => m.Mappamondo)
      },
      {
        path: 'bacheca',
        data: { bodyClasses: ['bacheca-page'] },
        loadComponent: () => import('./pages/bacheca/bacheca').then((m) => m.Bacheca)
      },
      {
        path: 'lettere',
        data: { bodyClasses: ['lettere-page'] },
        loadComponent: () => import('./pages/lettere/lettere').then((m) => m.Lettere)
      },
      {
        path: 'tavolo-da-gioco',
        data: { bodyClasses: ['tavolo-page'] },
        loadComponent: () => import('./pages/tavolo-da-gioco/tavolo-da-gioco').then((m) => m.TavoloDaGioco)
      },
      {
        path: 'tavolo-da-gioco/gdr',
        data: { bodyClasses: ['tavolo-page'] },
        loadComponent: () => import('./pages/gdr/gdr').then((m) => m.Gdr)
      },
      {
        path: 'tavolo-da-gioco/gdr/il-prezzo-della-verita',
        data: { bodyClasses: ['tavolo-page'] },
        loadComponent: () =>
          import('./pages/il-prezzo-della-verita/il-prezzo-della-verita').then((m) => m.IlPrezzoDellaVerita)
      },
      {
        path: 'tavolo-da-gioco/gdr/il-prezzo-della-verita/avventura',
        data: { bodyClasses: ['tavolo-page'] },
        loadComponent: () => import('./pages/avventura/avventura').then((m) => m.Avventura)
      },
      {
        path: 'tavolo-da-gioco/gdr/il-prezzo-della-verita/la-tua-maga',
        data: { bodyClasses: ['tavolo-page'] },
        loadComponent: () => import('./pages/la-tua-maga/la-tua-maga').then((m) => m.LaTuaMaga)
      },
      {
        path: 'tavolo-da-gioco/gdr/il-prezzo-della-verita/i-tuoi-appunti',
        data: { bodyClasses: ['tavolo-page'] },
        loadComponent: () => import('./pages/i-tuoi-appunti/i-tuoi-appunti').then((m) => m.ITuoiAppunti)
      },
      {
        path: 'tavolo-da-gioco/cruciverba',
        loadComponent: () => import('./pages/cruciverba/cruciverba').then((m) => m.Cruciverba)
      }
    ]
  },
  {
    path: '**',
    data: { bodyClasses: ['not-found-page'] },
    loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFound)
  }
];
