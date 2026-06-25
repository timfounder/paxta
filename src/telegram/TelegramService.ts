import type { Unsubscribe } from '@shared/types/function';
import { logger } from '@shared/utils/logger';

import type {
  TelegramColorScheme,
  TelegramThemeParams,
  TelegramUser,
  TelegramWebApp,
} from './telegram.types';

const FALLBACK_THEME: TelegramThemeParams = {
  bg_color: '#0a0a0c',
  text_color: '#f5f5f7',
  hint_color: '#8a8a92',
  button_color: '#b3122b',
  button_text_color: '#ffffff',
  secondary_bg_color: '#15151a',
};

/**
 * Single, fail-safe gateway to the Telegram Mini Apps runtime. Every method
 * degrades to a no-op (or a sensible default) when the game runs outside
 * Telegram — e.g. in a desktop browser during development — so the rest of the
 * codebase never has to branch on availability.
 */
export class TelegramService {
  private readonly log = logger.child('telegram');
  private readonly webApp: TelegramWebApp | null;
  private initialised = false;

  constructor() {
    this.webApp = typeof window !== 'undefined' ? (window.Telegram?.WebApp ?? null) : null;
  }

  public get isAvailable(): boolean {
    return this.webApp !== null;
  }

  public get user(): TelegramUser | null {
    return this.webApp?.initDataUnsafe.user ?? null;
  }

  public get startParam(): string | null {
    return this.webApp?.initDataUnsafe.start_param ?? null;
  }

  public get colorScheme(): TelegramColorScheme {
    return this.webApp?.colorScheme ?? 'dark';
  }

  public get themeParams(): TelegramThemeParams {
    return this.webApp?.themeParams ?? FALLBACK_THEME;
  }

  /** Raw init data string; forward this to the backend for verification. */
  public get initData(): string {
    return this.webApp?.initData ?? '';
  }

  /**
   * Prepare the Mini App for a full-screen game: expand to full height, lock the
   * vertical swipe-to-close gesture, confirm before closing and sync chrome
   * colours to the theme. Safe to call multiple times.
   */
  public init(): void {
    if (this.initialised) return;
    this.initialised = true;
    this.applyThemeToCss();

    if (!this.webApp) {
      this.log.warn('Telegram WebApp unavailable — running in standalone mode');
      return;
    }

    this.webApp.ready();
    this.webApp.expand();
    this.webApp.disableVerticalSwipes();
    this.webApp.enableClosingConfirmation();

    const bg = this.themeParams.bg_color ?? FALLBACK_THEME.bg_color;
    if (bg) {
      this.webApp.setHeaderColor(bg);
      this.webApp.setBackgroundColor(bg);
    }

    this.webApp.onEvent('themeChanged', this.handleThemeChanged);
    this.webApp.onEvent('viewportChanged', this.handleViewportChanged);
    this.applyViewportToCss();
    this.log.info(`Initialised on ${this.webApp.platform} (v${this.webApp.version})`);
  }

  public onThemeChanged(handler: () => void): Unsubscribe {
    if (!this.webApp) return () => undefined;
    this.webApp.onEvent('themeChanged', handler);
    return () => this.webApp?.offEvent('themeChanged', handler);
  }

  public onViewportChanged(handler: () => void): Unsubscribe {
    if (!this.webApp) return () => undefined;
    this.webApp.onEvent('viewportChanged', handler);
    return () => this.webApp?.offEvent('viewportChanged', handler);
  }

  public showBackButton(handler: () => void): Unsubscribe {
    if (!this.webApp) return () => undefined;
    const { BackButton } = this.webApp;
    BackButton.onClick(handler);
    BackButton.show();
    return () => {
      BackButton.offClick(handler);
      BackButton.hide();
    };
  }

  public hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): void {
    this.webApp?.HapticFeedback.impactOccurred(style);
  }

  public hapticNotification(type: 'error' | 'success' | 'warning'): void {
    this.webApp?.HapticFeedback.notificationOccurred(type);
  }

  public close(): void {
    this.webApp?.close();
  }

  private readonly handleThemeChanged = (): void => {
    this.applyThemeToCss();
  };

  private readonly handleViewportChanged = (): void => {
    this.applyViewportToCss();
  };

  /** Expose the stable viewport height as `--tg-viewport-height` for layout. */
  private applyViewportToCss(): void {
    if (typeof document === 'undefined') return;
    const height =
      this.webApp?.viewportStableHeight ?? (typeof window === 'undefined' ? 0 : window.innerHeight);
    if (height > 0) {
      document.documentElement.style.setProperty('--tg-viewport-height', `${height}px`);
    }
  }

  /** Project Telegram theme params onto CSS custom properties on `:root`. */
  private applyThemeToCss(): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const theme = this.themeParams;
    const assign = (name: string, value: string | undefined): void => {
      if (value) root.style.setProperty(name, value);
    };
    assign('--tg-bg', theme.bg_color ?? FALLBACK_THEME.bg_color);
    assign('--tg-text', theme.text_color ?? FALLBACK_THEME.text_color);
    assign('--tg-hint', theme.hint_color ?? FALLBACK_THEME.hint_color);
    assign('--tg-button', theme.button_color ?? FALLBACK_THEME.button_color);
    assign('--tg-button-text', theme.button_text_color ?? FALLBACK_THEME.button_text_color);
    assign('--tg-secondary-bg', theme.secondary_bg_color ?? FALLBACK_THEME.secondary_bg_color);
  }
}

/** Process-wide Telegram gateway. */
export const telegram = new TelegramService();
