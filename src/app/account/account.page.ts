import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, personOutline } from 'ionicons/icons';
import { AdminContentService } from '../admin/admin-content.service';
import { AccountService } from '../services/account.service';
import { QUIZ_CATALOG, QuizBest, QuizScoresService } from '../services/quiz-scores.service';
import { ThemeMode, ThemeService } from '../services/theme';
import { UiFeedbackService } from '../services/ui-feedback.service';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';
import {
  EMAIL_MAX,
  NAME_MAX,
  PASSWORD_MAX,
  validateRegistration,
  validateSignIn
} from '../shared/account-validation';
import { toFriendlyMessage } from '../shared/friendly-error';

type AuthMode = 'signin' | 'register';
type AccountRoleView = 'guest' | 'user' | 'admin';

/** The parts of the Firebase user this page reads. */
interface SignedInUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAnonymous: boolean;
  metadata?: { creationTime?: string };
}

@Component({
  selector: 'app-account',
  templateUrl: './account.page.html',
  styleUrls: ['./account.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppBarComponent]
})
export class AccountPage implements OnInit {
  private auth = inject(AngularFireAuth);
  private accounts = inject(AccountService);
  private adminContent = inject(AdminContentService);
  private themeService = inject(ThemeService);
  private feedback = inject(UiFeedbackService);
  private quizScores = inject(QuizScoresService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  /** Each account load gets a number so a slow, older load can never overwrite a newer one. */
  private loadCount = 0;
  /** True while registering: the new account is briefly signed in, and the page must not show it. */
  private ignoreAuthEvents = false;

  readonly nameMax = NAME_MAX;
  readonly emailMax = EMAIL_MAX;
  readonly passwordMax = PASSWORD_MAX;

  mode: AuthMode = 'signin';
  name = '';
  email = '';
  password = '';
  confirmPassword = '';

  accountRole: AccountRoleView = 'guest';
  accountName = '';
  accountEmail = '';
  memberSince: Date | null = null;

  authLoading = true;
  authBusy = false;
  authError = '';
  /** Good news shown on the sign-in form, e.g. right after registering. */
  authNotice = '';

  /** Highest score for each quiz, shown once signed in. */
  quizRows: { key: string; title: string; type: string; best: QuizBest | null }[] =
    QUIZ_CATALOG.map(quiz => ({ ...quiz, best: null }));

  selectedTheme: ThemeMode = 'default';
  colorBlindMode = false;

  constructor() {
    addIcons({ checkmarkCircleOutline, personOutline });
  }

  async ngOnInit(): Promise<void> {
    this.selectedTheme = this.themeService.getTheme();
    this.colorBlindMode = await this.themeService.getColorBlindMode();

    this.quizScores.getBestScores().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: scores => {
        this.quizRows = QUIZ_CATALOG.map(quiz => ({ ...quiz, best: scores[quiz.key] ?? null }));
      },
      error: error => console.warn('Could not load quiz scores:', error)
    });

    this.auth.authState.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: user => {
        if (!this.ignoreAuthEvents) {
          void this.loadAccount(user);
        }
      },
      error: error => {
        this.authLoading = false;
        this.authError = 'Could not load account status. Please try again.';
        console.error('Could not load Firebase auth state:', error);
      }
    });
  }

  get canSubmit(): boolean {
    if (this.authBusy || !this.email.trim() || !this.password) {
      return false;
    }
    return this.mode === 'signin' || (!!this.name.trim() && !!this.confirmPassword);
  }

  get passwordsMismatch(): boolean {
    return this.mode === 'register' && !!this.confirmPassword && this.password !== this.confirmPassword;
  }

  get displayName(): string {
    return this.accountName || this.accountEmail || 'Your account';
  }

  get initial(): string {
    return this.displayName.trim().charAt(0).toUpperCase() || '?';
  }

  get roleLabel(): string {
    return this.accountRole === 'admin' ? 'Administrator' : 'User';
  }

  setMode(mode: AuthMode): void {
    this.mode = mode;
    this.authError = '';
    this.authNotice = '';
    this.password = '';
    this.confirmPassword = '';
  }

  async submit(): Promise<void> {
    if (this.authBusy) {
      return;
    }
    if (this.mode === 'register') {
      await this.register();
    } else {
      await this.signIn();
    }
  }

  async signOut(): Promise<void> {
    this.authBusy = true;
    this.authError = '';
    try {
      await this.accounts.signOut();
      this.resetForm();
    } catch (error) {
      this.authError = toFriendlyMessage(error, 'Could not sign out. Please try again.');
      console.error('Account sign-out failed:', error);
    } finally {
      this.authBusy = false;
    }
  }

  onThemeChange(event: any): void {
    this.themeService.setTheme(event.detail.value as ThemeMode);
  }

  async onColorBlindModeChange(event: any): Promise<void> {
    const enabled = event.detail.checked;
    this.colorBlindMode = enabled;
    await this.themeService.setColorBlindMode(enabled);
  }

  private async signIn(): Promise<void> {
    const problem = validateSignIn(this.email, this.password);
    if (problem) {
      this.authError = problem;
      return;
    }

    this.authBusy = true;
    this.authError = '';
    this.authNotice = '';
    try {
      // The role is read from the account afterwards (see loadAccount): admins go
      // to the content manager, everyone else stays here.
      await this.accounts.signIn(this.email.trim(), this.password);
      this.resetForm();
    } catch (error) {
      this.authError = toFriendlyMessage(error, 'Sign-in failed. Check your email and password and try again.');
      console.error('Account sign-in failed:', error);
    } finally {
      this.authBusy = false;
    }
  }

  private async register(): Promise<void> {
    const problem = validateRegistration(this.name, this.email, this.password, this.confirmPassword);
    if (problem) {
      this.authError = problem;
      return;
    }

    const name = this.name.trim();
    const email = this.email.trim();
    this.authBusy = true;
    this.authError = '';
    this.authNotice = '';
    this.ignoreAuthEvents = true;

    let created = false;
    let signedOut = false;
    try {
      await this.accounts.register(name, email, this.password);
      created = true;
      // Creating an account signs it in. Registering should only create it, so
      // go straight back to guest and let the person sign in themselves.
      await this.accounts.finishRegistration();
      signedOut = true;
    } catch (error) {
      if (!created) {
        this.authError = toFriendlyMessage(error, 'Could not create your account. Please try again.');
      }
      console.error('Account registration failed:', error);
    } finally {
      this.ignoreAuthEvents = false;
      this.authBusy = false;
    }

    if (created && signedOut) {
      const message = 'Account created. You can now sign in.';
      this.resetForm();
      this.email = email;
      this.authNotice = message;
      void this.feedback.success(message);
    } else if (created) {
      void this.feedback.success('Account created. You are signed in.');
    }
    await this.loadAccount(await this.auth.currentUser);
  }

  private resetForm(): void {
    this.name = '';
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.mode = 'signin';
  }

  private async loadAccount(user: SignedInUser | null): Promise<void> {
    const load = ++this.loadCount;
    this.authLoading = true;

    if (!user || user.isAnonymous) {
      this.showGuest();
      this.authLoading = false;
      return;
    }

    try {
      const [isAdmin, profile] = await Promise.all([
        this.adminContent.isAdmin(user.uid),
        this.accounts.getProfile(user.uid)
      ]);
      if (load !== this.loadCount) {
        return;
      }

      this.accountRole = isAdmin ? 'admin' : 'user';
      this.accountName = profile?.name || user.displayName || '';
      this.accountEmail = user.email ?? profile?.email ?? '';
      const created = profile?.createdAt ?? Date.parse(user.metadata?.creationTime ?? '');
      this.memberSince = Number.isFinite(created) ? new Date(created) : null;
      this.authError = '';

      if (isAdmin) {
        void this.router.navigateByUrl('/admin');
      }
    } catch (error) {
      if (load !== this.loadCount) {
        return;
      }
      this.accountRole = 'user';
      this.accountName = user.displayName ?? '';
      this.accountEmail = user.email ?? '';
      this.memberSince = null;
      this.authError = 'Could not verify account access. Please try again.';
      console.error('Could not verify admin access:', error);
    } finally {
      if (load === this.loadCount) {
        this.authLoading = false;
      }
    }
  }

  private showGuest(): void {
    this.accountRole = 'guest';
    this.accountName = '';
    this.accountEmail = '';
    this.memberSince = null;
  }
}
