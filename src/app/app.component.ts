// src/app/app.component.ts

import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { ThemeService } from './services/theme';
import { firstValueFrom, take } from 'rxjs';

// --- Use COMPAT IMPORTS ---
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  private themeService = inject(ThemeService);
  private auth = inject(AngularFireAuth);
  private router = inject(Router);

  constructor() {
    this.signInAnonymously();
    App.addListener('backButton', () => {
      const url = this.router.url || '';
      if (url.startsWith('/tabs')) {
        App.exitApp();
        return;
      }
      if (window.history.length > 1) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });
  }

  async signInAnonymously() {
    try {
      const user = await firstValueFrom(this.auth.authState.pipe(take(1)));
      if (user) {
        return;
      }
      // --- Use compat syntax ---
      await this.auth.signInAnonymously();
      console.log('Signed in anonymously!');
    } catch (error) {
      console.error('Error signing in anonymously:', error);
    }
  }
}