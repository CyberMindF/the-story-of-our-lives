import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth.service';
import { CarteBustineService } from './core/carte-bustine.service';
import { RealtimeService } from './core/realtime.service';
import { ThemeService } from './core/theme.service';
import { WorldSettingsService } from './core/world-settings.service';
import { WorldFish } from './shared/world-fish';
import { WorldLanterns } from './shared/world-lanterns';
import { WorldLeaves } from './shared/world-leaves';
import { WorldMoon } from './shared/world-moon';
import { WorldPetals } from './shared/world-petals';
import { WorldSparkles } from './shared/world-sparkles';
import { WorldStars } from './shared/world-stars';
import { WorldWaves } from './shared/world-waves';
import { WorldBubbles } from './shared/world-bubbles';
import { WorldHearts } from './shared/world-hearts';
import { WorldPearlShimmers } from './shared/world-pearl-shimmers';
import { WorldSilk } from './shared/world-silk';
import { WorldShootingStars } from './shared/world-shooting-stars';
import { WorldStickers } from './shared/world-stickers';
import { WorldBalloons } from './shared/world-balloons';
import { WorldFireworks } from './shared/world-fireworks';
import { GlobalChatWidget } from './shared/global-chat-widget/global-chat-widget';
import { GlobalChatService } from './core/global-chat.service';

// Eventi usati come "prova di attività" per rinnovare lo sblocco della Chiave (vedi
// AuthService.touchAccessUnlock) — non serve seguire ogni movimento del mouse, basta sapere
// che qualcuno sta ancora interagendo con la pagina.
const ACTIVITY_EVENTS = ['pointerdown', 'keydown'] as const;
// Non scrivere su sessionStorage a ogni singolo click: un tocco al minuto basta per restare
// entro la finestra di inattività di un'ora.
const ACTIVITY_TOUCH_THROTTLE_MS = 60 * 1000;
const VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

const ROUTE_BODY_CLASSES = [
  'access-locked',
  'portone-page',
  'world-page',
  'bacheca-page',
  'calendar-page',
  'music-page',
  'lettere-page',
  'map-page',
  'globe-page',
  'ponti-page',
  'stories-page',
  'suggerimenti-page',
  'impostazioni-mondo-page',
  'sky-view-page',
  'tavolo-page',
  'not-found-page'
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalChatWidget, WorldStars, WorldShootingStars, WorldLanterns, WorldMoon, WorldSparkles, WorldLeaves, WorldWaves, WorldFish, WorldPetals, WorldBubbles, WorldHearts, WorldPearlShimmers, WorldSilk, WorldStickers, WorldBalloons, WorldFireworks],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly themeService = inject(ThemeService);
  private readonly worldSettingsService = inject(WorldSettingsService);
  protected readonly authService = inject(AuthService);
  private readonly carteBustineService = inject(CarteBustineService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly globalChat = inject(GlobalChatService);
  private lastActivityTouchAt = 0;
  private readonly currentAssetSignature = this.assetSignature(document);
  private checkingBuildVersion = false;
  private worldSettingsLoadedForUserId: number | null = null;
  protected readonly updateAvailable = signal(false);
  protected readonly showGlobalChat = signal(this.router.url.split('?')[0] !== '/ponti-chat');

  constructor() {
    document.body.classList.add('world-atmosphere');
    this.themeService.applySavedTheme();
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.applyRouteBodyClasses();
        const showChat = event.urlAfterRedirects.split('?')[0] !== '/ponti-chat';
        this.showGlobalChat.set(showChat);
        if (!showChat) this.globalChat.panelOpen.set(false);
      });

    const onActivity = () => this.touchAccessUnlockThrottled();
    ACTIVITY_EVENTS.forEach((eventName) => document.addEventListener(eventName, onActivity, { passive: true }));
    this.destroyRef.onDestroy(() => {
      ACTIVITY_EVENTS.forEach((eventName) => document.removeEventListener(eventName, onActivity));
    });

    const checkBuildVersion = () => void this.checkBuildVersion();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkBuildVersion();
    };
    const versionTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') checkBuildVersion();
    }, VERSION_CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      window.clearInterval(versionTimer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    });
    checkBuildVersion();

    this.realtimeService.on('world-settings:changed')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event['actorUserId'] === this.authService.currentUser()?.id) return;
        const userId = this.authService.currentUser()?.id;
        if (userId !== undefined) void this.loadSharedWorldSettings(userId);
      });

    effect(() => {
      const userId = this.authService.currentUser()?.id;
      if (userId === undefined) {
        this.globalChat.clear();
        this.carteBustineService.clear();
        this.realtimeService.disconnect();
        this.worldSettingsLoadedForUserId = null;
        return;
      }
      this.realtimeService.connect();
      void this.globalChat.startForCurrentUser();
      void this.carteBustineService.load(userId).catch((error) => {
        console.warn('Impossibile aggiornare la streak di accesso:', error);
      });
      if (this.worldSettingsLoadedForUserId !== userId) {
        this.worldSettingsLoadedForUserId = userId;
        void this.loadSharedWorldSettings(userId);
      }
    });
  }

  private async loadSharedWorldSettings(userId: number): Promise<void> {
    const loaded = await this.worldSettingsService.load();
    if (!loaded) {
      if (this.worldSettingsLoadedForUserId === userId) this.worldSettingsLoadedForUserId = null;
      return;
    }
    // Se nel frattempo è avvenuto il logout o è cambiato account, non applicare alla nuova
    // sessione una risposta iniziata per quella precedente.
    if (this.authService.currentUser()?.id === userId) {
      this.themeService.applySharedTheme();
    }
  }

  protected refreshForUpdate(): void {
    window.location.reload();
  }

  private async checkBuildVersion(): Promise<void> {
    if (this.checkingBuildVersion || this.updateAvailable()) return;
    this.checkingBuildVersion = true;
    try {
      const response = await fetch(`/?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'text/html' }
      });
      if (!response.ok) return;
      const latestDocument = new DOMParser().parseFromString(await response.text(), 'text/html');
      const latestAssetSignature = this.assetSignature(latestDocument);
      if (latestAssetSignature && latestAssetSignature !== this.currentAssetSignature) {
        this.updateAvailable.set(true);
      }
    } catch (error) {
      console.warn('Impossibile controllare la versione del sito:', error);
    } finally {
      this.checkingBuildVersion = false;
    }
  }

  private assetSignature(root: Document): string {
    const assets = [
      ...Array.from(root.querySelectorAll<HTMLScriptElement>('script[src]')).map((element) => element.getAttribute('src')),
      ...Array.from(root.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')).map((element) => element.getAttribute('href'))
    ].filter((value): value is string => {
      if (!value) return false;
      const fileName = value.split('/').pop()?.split('?')[0] || '';
      return /^(main|polyfills|styles)-[^/]+\.(js|css)$/.test(fileName);
    });
    return [...new Set(assets)].sort().join('|');
  }

  // Rinnova lo sblocco della Chiave durante l'uso attivo, anche restando sulla stessa pagina
  // (es. una lunga sessione di cruciverba), non solo quando si cambia rotta.
  private touchAccessUnlockThrottled(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId === undefined) {
      return;
    }
    const now = Date.now();
    if (now - this.lastActivityTouchAt < ACTIVITY_TOUCH_THROTTLE_MS) {
      return;
    }
    this.lastActivityTouchAt = now;
    this.authService.touchAccessUnlock(userId);
  }

  private applyRouteBodyClasses(): void {
    let route = this.activatedRoute;
    while (route.firstChild) {
      route = route.firstChild;
    }

    document.body.classList.remove(...ROUTE_BODY_CLASSES);
    const bodyClasses = route.snapshot.data['bodyClasses'];
    if (Array.isArray(bodyClasses)) {
      document.body.classList.add(...bodyClasses);
    }
  }
}
