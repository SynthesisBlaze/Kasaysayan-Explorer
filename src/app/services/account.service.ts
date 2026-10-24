import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Database, get, ref, serverTimestamp, set } from '@angular/fire/database';
import { FavoriteData, FavoritesService } from './favorites.service';

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
  private favorites = inject(FavoritesService);

  /** Favorites a guest saved before registering; they go back to the new guest session after sign-out. */
  private guestFavoritesDuringRegistration: Record<string, FavoriteData> = {};

  /**
   * Signs in. Favorites the person saved as a guest are added to the account,
   * so they are saved to it from now on.
   */
  async signIn(email: string, password: string): Promise<void> {
    const guestFavorites = await this.readGuestFavorites();
    await this.auth.signInWithEmailAndPassword(email, password);
    try {
      await this.favorites.addMissing(guestFavorites);
    } catch (error) {
      console.error('Could not move guest favorites into the account:', error);
    }
  }

  /**
   * Creates an email/password account and saves its profile with the `user` role.
   * Administrators are never created here: the database rules only let the app
   * write `role: "user"`, so the admin role is granted from the Firebase Console.
   * Creating the account also signs it in; the caller decides whether to keep that session.
   * Resolves to false when the account exists but its profile could not be saved.
   */
  async register(name: string, email: string, password: string): Promise<boolean> {
    this.guestFavoritesDuringRegistration = await this.readGuestFavorites();
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

  /**
   * Ends the session that registering started, so the person is not signed in
   * automatically. Favorites saved as a guest stay with the new guest session.
   */
  async finishRegistration(): Promise<void> {
    const guestFavorites = this.guestFavoritesDuringRegistration;
    this.guestFavoritesDuringRegistration = {};
    await this.signOut();
    try {
      await this.favorites.addMissing(guestFavorites);
    } catch (error) {
      console.error('Could not keep guest favorites after registering:', error);
    }
  }

  /**
   * Signs out, then goes back to the anonymous guest session the rest of the app relies on.
   * That is a new, empty guest session, so favorites are cleared along with the account.
   */
  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.auth.signInAnonymously();
  }

  private async readGuestFavorites(): Promise<Record<string, FavoriteData>> {
    try {
      const current = await this.auth.currentUser;
      return current?.isAnonymous ? await this.favorites.readAll(current.uid) : {};
    } catch (error) {
      console.warn('Could not read guest favorites:', error);
      return {};
    }
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
