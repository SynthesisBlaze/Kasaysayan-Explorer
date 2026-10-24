import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Database, get, ref, serverTimestamp, set } from '@angular/fire/database';

export type AccountRole = 'user' | 'admin';

/** What the app stores about an account under `users/<uid>`. */
export interface AccountProfile {
  name: string;
  email: string;
  role: AccountRole;
  /** Milliseconds since 1970, or null for accounts created before profiles existed. */
  createdAt: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private auth = inject(AngularFireAuth);
  private database = inject(Database);

  signIn(email: string, password: string): Promise<unknown> {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  /**
   * Creates an email/password account and saves its profile with the `user` role.
   * Administrators are never created here: the database rules only let the app
   * write `role: "user"`, so the admin role is granted from the Firebase Console.
   * Creating the account also signs it in; the caller decides whether to keep that session.
   * Resolves to false when the account exists but its profile could not be saved.
   */
  async register(name: string, email: string, password: string): Promise<boolean> {
    const credential = await this.auth.createUserWithEmailAndPassword(email, password);
    const user = credential.user;
    if (!user) {
      return false;
    }

    try {
      await user.updateProfile({ displayName: name });
      await set(ref(this.database, `users/${user.uid}`), {
        name,
        email,
        role: 'user',
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      // The sign-in itself worked; the account still behaves as a regular user.
      console.error('Could not save the account profile:', error);
      return false;
    }
  }

  /** Signs out, then goes back to the anonymous guest session the rest of the app relies on. */
  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.auth.signInAnonymously();
  }

  async getProfile(uid: string): Promise<AccountProfile | null> {
    try {
      const value: unknown = (await get(ref(this.database, `users/${uid}`))).val();
      if (!value || typeof value !== 'object') {
        return null;
      }
      const record = value as Record<string, unknown>;
      return {
        name: typeof record['name'] === 'string' ? record['name'] : '',
        email: typeof record['email'] === 'string' ? record['email'] : '',
        role: record['role'] === 'admin' ? 'admin' : 'user',
        createdAt: typeof record['createdAt'] === 'number' ? record['createdAt'] : null
      };
    } catch (error) {
      // Older accounts and not-yet-deployed rules have no readable profile.
      console.warn('Could not read the account profile:', error);
      return null;
    }
  }
}
