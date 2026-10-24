import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { AdminContentService } from '../admin/admin-content.service';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';
import { toFriendlyMessage } from '../shared/friendly-error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX = 254;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppBarComponent]
})
export class AccountPage implements OnInit {
  private auth = inject(AngularFireAuth);
  private adminContent = inject(AdminContentService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  email = '';
  password = '';
  accountRole: 'guest' | 'user' | 'admin' = 'guest';
  accountEmail = '';
  authLoading = true;
  authBusy = false;
  authError = '';

  ngOnInit(): void {
    this.auth.authState.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        this.authLoading = true;
        this.accountEmail = user?.email ?? '';
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

  async signIn(): Promise<void> {
    const email = this.email.trim();
    if (!email || !this.password) {
      this.authError = 'Enter your email and password.';
      return;
    }
    if (email.length > EMAIL_MAX || !EMAIL_PATTERN.test(email)) {
      this.authError = 'Enter a valid email address, for example name@example.com.';
      return;
    }
    if (this.password.length < PASSWORD_MIN || this.password.length > PASSWORD_MAX) {
      this.authError = `Password must be ${PASSWORD_MIN}-${PASSWORD_MAX} characters.`;
      return;
    }

    this.authBusy = true;
    this.authError = '';
    try {
      await this.auth.signInWithEmailAndPassword(email, this.password);
      this.password = '';
    } catch (error) {
      this.authError = toFriendlyMessage(error, 'Sign-in failed. Check your email and password and try again.');
      console.error('Account sign-in failed:', error);
    } finally {
      this.authBusy = false;
    }
  }

  async signOut(): Promise<void> {
    this.authBusy = true;
    this.authError = '';
    try {
      await this.auth.signOut();
      await this.auth.signInAnonymously();
      this.password = '';
    } catch (error) {
      this.authError = toFriendlyMessage(error, 'Could not sign out. Please try again.');
      console.error('Account sign-out failed:', error);
    } finally {
      this.authBusy = false;
    }
  }
}
