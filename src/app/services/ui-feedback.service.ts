import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AlertController, ToastController } from '@ionic/angular';

export interface ToastAction {
  text: string;
  handler: () => void | Promise<void>;
}

export interface ConfirmOptions {
  header: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  destructive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UiFeedbackService {
  constructor(
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    router: Router
  ) {
    router.events
      .pipe(filter((e) => e instanceof NavigationStart))
      .subscribe(() => this.dismissToast());
  }

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
    }
  }

  success(message: string, action?: ToastAction): Promise<void> {
    return this.present(message, 'success', 'checkmark-circle-outline', action ? 5000 : 2000, action);
  }

  removed(message: string, action?: ToastAction): Promise<void> {
    return this.present(message, 'removed', 'trash-outline', action ? 5000 : 2000, action);
  }

  error(message: string, retry?: ToastAction): Promise<void> {
    return this.present(message, 'error', 'alert-circle-outline', 6000, retry);
  }

  info(message: string): Promise<void> {
    return this.present(message, 'info', 'information-circle-outline', 2500);
  }

  async confirm(opts: ConfirmOptions): Promise<boolean> {
    const alert = await this.alertCtrl.create({
      header: opts.header,
      message: opts.message,
      cssClass: 'app-alert',
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
      position: 'bottom',
      positionAnchor: this.visibleTabBar(),
      cssClass: ['app-toast', `app-toast-${variant}`],
      buttons
    } as any);
    await toast.present();
  }
}