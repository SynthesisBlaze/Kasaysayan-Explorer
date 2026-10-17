// src/app/app.component.ts

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { ThemeService } from './services/theme';

// --- Use COMPAT IMPORTS ---
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false
})
export class AppComponent {
  constructor(
    private themeService: ThemeService,
    // --- Use constructor injection ---
    private auth: AngularFireAuth,
    private router: Router
  ) {
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
      // --- Use compat syntax ---
      await this.auth.signInAnonymously();
      console.log('Signed in anonymously!');
    } catch (error) {
      console.error('Error signing in anonymously:', error);
    }
  }
}