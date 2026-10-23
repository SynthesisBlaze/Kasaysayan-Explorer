import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonButton, IonContent, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ThemeService, ThemeMode } from '../services/theme';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';
import { AdminContentService } from '../admin/admin-content.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    AppBarComponent
  ]
})
export class SettingsPage implements OnInit {
  private themeService = inject(ThemeService);
  private auth = inject(AngularFireAuth);
  private adminContent = inject(AdminContentService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  selectedTheme: ThemeMode = 'default';
  colorBlindMode: boolean = false;
  accountRole: 'guest' | 'user' | 'admin' = 'guest';
  accountEmail = '';
  accountUid = '';
  authLoading = true;
  authError = '';

  async ngOnInit() {
    this.selectedTheme = this.themeService.getTheme();
    this.colorBlindMode = await this.themeService.getColorBlindMode();
    console.log('Current theme on load:', this.selectedTheme);
    console.log('Color blind mode on load:', this.colorBlindMode);

    this.auth.authState.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        this.authLoading = true;
        this.accountEmail = user?.email ?? '';
        this.accountUid = user?.uid ?? '';
        if (!user || user.isAnonymous) {
          this.accountRole = 'guest';
          this.authLoading = false;
          return;
        }
        void this.adminContent.isAdmin(user.uid).then(isAdmin => {
          this.accountRole = isAdmin ? 'admin' : 'user';
          if (isAdmin) {
            void this.router.navigateByUrl('/admin');
          }
        }).catch(error => {
          this.authError = 'Could not verify account access. Please try again.';
          console.error('Could not verify admin access:', error);
          this.accountRole = 'user';
        }).finally(() => {
          this.authLoading = false;
        });
      },
      error: error => {
        this.authLoading = false;
        this.authError = 'Could not load account status. Please try again.';
        console.error('Could not load Firebase auth state:', error);
      }
    });
  }

  onThemeChange(event: any) {
    const theme = event.detail.value as ThemeMode;
    console.log('Theme changing to:', theme);
    this.themeService.setTheme(theme);
    console.log('Body classes after change:', document.body.className);
  }

  async onColorBlindModeChange(event: any) {
    const enabled = event.detail.checked;
    console.log('Color blind mode:', enabled);
    this.colorBlindMode = enabled;
    await this.themeService.setColorBlindMode(enabled);
  }
}