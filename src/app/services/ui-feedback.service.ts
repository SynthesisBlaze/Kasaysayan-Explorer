import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AlertController, ToastController } from '@ionic/angular';

/** Optional button shown inside a toast (e.g. "Undo" or "Retry"). */
export interface ToastAction {
  text: string;
  handler: () => void | Promise<void>;
}

export interface ConfirmOptions {
  header: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  /** Styles the confirm button as a dangerous (red) action. */
  destructive?: boolean;
}

/**
 * One place for every toast and confirmation in the app, so feedback looks and
 * behaves the same on every screen (HCI: consistency & standards).
 *
 *  - success()  -> confirms an action happened         (visibility of system status)
 *  - error()    -> plain-language message + Retry      (help users recover from errors)
 *  - confirm()  -> asks before destructive actions     (error prevention)
 */
@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    router: Router
  ) {
    // A toast belongs to the screen that showed it: close it as soon as the user
    // navigates away, so it can never sit on top of the tab bar of the next page.
    router.events
      .pipe(filter((e) => e instanceof NavigationStart))
      .subscribe(() => this.dismissToast());
  }

  /**
   * The tab bar to float above, but only when it is really on screen.
   * Ionic keeps the tabs page in the DOM (hidden) while a detail page is open;
   * anchoring to that hidden bar pushed the toast off-screen.
   */
  private visibleTabBar(): HTMLElement | undefined {
    const bar = document.querySelector('ion-tab-bar') as HTMLElement | null;
    if (!bar) return undefined;
    const rect = bar.getBoundingClientRect();
    const hidden = bar.closest('.ion-page-hidden, .ion-page-invisible');
    const onScreen = rect.height > 0 && rect.bottom <= window.innerHeight + 1;
    return !hidden && onScreen ? bar : undefined;
  }

  private async dismissToast(): Promise<void> {
    try {
      await this.toastCtrl.dismiss();
    } catch {
      /* nothing to dismiss */
    }
  }

  /** Green: something was added / saved. */
  success(message: string, action?: ToastAction): Promise<void> {
    // Toasts with an action stay a little longer so the user has time to tap it.
    return this.present(message, 'success', 'checkmark-circle-outline', action ? 5000 : 2000, action);
  }

  /** Red: something was removed / deleted (different colour + icon from success). */
  removed(message: string, action?: ToastAction): Promise<void> {
    return this.present(message, 'removed', 'trash-outline', action ? 5000 : 2000, action);
  }

  /** Amber: something went wrong (always paired with a way to retry when possible). */
  error(message: string, retry?: ToastAction): Promise<void> {
    return this.present(message, 'error', 'alert-circle-outline', 6000, retry);
  }

  info(message: string): Promise<void> {
    return this.present(message, 'info', 'information-circle-outline', 2500);
  }

  /** Resolves true only when the user explicitly taps the confirm button. */
  async confirm(opts: ConfirmOptions): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: opts.header,
      message: opts.message,
      cssClass: 'app-alert',
      // Cancel comes first so the safe choice is the easiest to reach.
      buttons: [
        { text: opts.cancelText ?? 'Cancel', role: 'cancel' },
        {
          text: opts.confirmText,
          role: 'confirm',
          cssClass: opts.destructive ? 'app-alert-danger' : ''
        }
      ]
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    return role === 'confirm';
  }

  private async present(
    message: string,
    variant: 'success' | 'removed' | 'error' | 'info',
    icon: string,
    duration: number,
    action?: ToastAction
  ): Promise<void> {
    // Replace any toast that is still visible instead of stacking them.
    await this.dismissToast();

    const buttons: any[] = [];
    if (action) {
      buttons.push({ text: action.text, role: 'action', handler: () => { action.handler(); } });
    }
    buttons.push({ icon: 'close-outline', role: 'cancel', htmlAttributes: { 'aria-label': 'Dismiss message' } });

    const toast = await this.toastCtrl.create({
      message,
      icon,
      duration,
      // Bottom = thumb zone, and the standard place for short confirmations.
      position: 'bottom',
      // On pages that have a tab bar, float above it instead of covering it.
      positionAnchor: this.visibleTabBar(),
      cssClass: ['app-toast', `app-toast-${variant}`],
      buttons
    } as any);
    await toast.present();
  }
}