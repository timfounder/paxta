/**
 * Hand-written typings for the subset of the official Telegram Mini Apps
 * platform (`telegram-web-app.js`) that PAXTA uses. Keeping our own surface
 * avoids coupling to a fast-moving third-party wrapper and documents exactly
 * which capabilities the game relies on.
 */
export type TelegramColorScheme = 'light' | 'dark';

export interface TelegramThemeParams {
  readonly bg_color?: string;
  readonly text_color?: string;
  readonly hint_color?: string;
  readonly link_color?: string;
  readonly button_color?: string;
  readonly button_text_color?: string;
  readonly secondary_bg_color?: string;
}

export interface TelegramUser {
  readonly id: number;
  readonly first_name: string;
  readonly last_name?: string;
  readonly username?: string;
  readonly language_code?: string;
  readonly is_premium?: boolean;
}

export interface TelegramInitDataUnsafe {
  readonly user?: TelegramUser;
  readonly auth_date?: number;
  readonly hash?: string;
  readonly start_param?: string;
}

export interface TelegramHapticFeedback {
  impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
  notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  selectionChanged(): void;
}

export interface TelegramBackButton {
  show(): void;
  hide(): void;
  onClick(handler: () => void): void;
  offClick(handler: () => void): void;
}

export interface TelegramWebApp {
  readonly initData: string;
  readonly initDataUnsafe: TelegramInitDataUnsafe;
  readonly colorScheme: TelegramColorScheme;
  readonly themeParams: TelegramThemeParams;
  readonly viewportHeight: number;
  readonly viewportStableHeight: number;
  readonly isExpanded: boolean;
  readonly version: string;
  readonly platform: string;
  readonly BackButton: TelegramBackButton;
  readonly HapticFeedback: TelegramHapticFeedback;

  ready(): void;
  expand(): void;
  close(): void;
  enableClosingConfirmation(): void;
  disableVerticalSwipes(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  onEvent(event: 'themeChanged' | 'viewportChanged', handler: () => void): void;
  offEvent(event: 'themeChanged' | 'viewportChanged', handler: () => void): void;
}

declare global {
  interface Window {
    readonly Telegram?: {
      readonly WebApp?: TelegramWebApp;
    };
  }
}
