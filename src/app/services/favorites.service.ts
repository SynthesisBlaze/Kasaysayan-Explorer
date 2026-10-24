import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Database, ref, set, update, remove, get, objectVal } from '@angular/fire/database';
import { Observable, distinctUntilChanged, filter, firstValueFrom, map, of, switchMap, take, timeout } from 'rxjs';

/** What is stored for each favorite, under `favorites/<uid>/<itemId>`. */
export interface FavoriteData {
  name: string;
  image: string;
  category: string;
  note?: string;
}

/**
 * Favorites belong to whoever is signed in. A guest has an anonymous account of
 * their own, so guests can save favorites too; signing out ends that session and
 * starts a new, empty one, which is what clears the Favorites page on sign out.
 */
@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private db = inject(Database);
  private auth = inject(AngularFireAuth);

  /** The signed-in account's id (guest sessions included); waits briefly while a session starts. */
  private async currentUid(): Promise<string> {
    const user = await firstValueFrom(
      this.auth.authState.pipe(
        filter((current): current is NonNullable<typeof current> => !!current),
        take(1),
        timeout(8000)
      )
    );
    return user.uid;
  }

  // ✅ Get all favorites of the current account (updates when someone signs in or out)
  getFavorites(): Observable<any[]> {
    return this.auth.authState.pipe(
      map(user => user?.uid ?? null),
      distinctUntilChanged(),
      switchMap(uid => (uid ? objectVal<any>(ref(this.db, `favorites/${uid}`)) : of(null))),
      map(data => {
        if (!data) return [];
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      })
    );
  }

  // ✅ Add or update favorite (keeps the personal note when one is passed in, e.g. on Undo)
  async addFavorite(item: any) {
    const uid = await this.currentUid();
    const itemRef = ref(this.db, `favorites/${uid}/${item.id}`);
    const data: any = {
      name: item.name,
      image: item.image,
      category: item.category
    };
    if (item.note) {
      data.note = item.note; // Firebase rejects `undefined`, so only add it when it exists
    }
    return set(itemRef, data);
  }

  // ✅ Edit: save (or clear) the user's personal note on a favorite
  async updateNote(itemId: string, note: string) {
    const uid = await this.currentUid();
    const itemRef = ref(this.db, `favorites/${uid}/${itemId}`);
    // `null` deletes the field in Firebase, so an empty note leaves no clutter behind
    return update(itemRef, { note: note.trim() ? note.trim() : null });
  }

  // ✅ Remove favorite by item ID
  async removeFavorite(itemId: string) {
    const uid = await this.currentUid();
    return remove(ref(this.db, `favorites/${uid}/${itemId}`));
  }

  // ✅ Check if an item is already a favorite
  async isFavorite(itemId: string): Promise<boolean> {
    if (!this.db) {
      console.error('Database not initialized');
      return false;
    }
    try {
      const uid = await this.currentUid();
      const snapshot = await get(ref(this.db, `favorites/${uid}/${itemId}`));
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  /** Every favorite of one account, keyed by item id (used to carry a guest's favorites into an account). */
  async readAll(uid: string): Promise<Record<string, FavoriteData>> {
    const value: unknown = (await get(ref(this.db, `favorites/${uid}`))).val();
    if (!value || typeof value !== 'object') {
      return {};
    }
    const items: Record<string, FavoriteData> = {};
    for (const [id, raw] of Object.entries(value as Record<string, any>)) {
      if (raw && typeof raw === 'object') {
        items[id] = {
          name: String(raw.name ?? ''),
          image: String(raw.image ?? ''),
          category: String(raw.category ?? ''),
          ...(raw.note ? { note: String(raw.note) } : {})
        };
      }
    }
    return items;
  }

  /** Adds favorites to the current account without touching ones it already has (their notes stay). */
  async addMissing(items: Record<string, FavoriteData>): Promise<void> {
    if (!Object.keys(items).length) {
      return;
    }
    const uid = await this.currentUid();
    const existing: unknown = (await get(ref(this.db, `favorites/${uid}`))).val();
    const taken = existing && typeof existing === 'object' ? existing : {};
    const additions: Record<string, FavoriteData> = {};
    for (const [id, item] of Object.entries(items)) {
      if (!(id in taken)) {
        additions[id] = item;
      }
    }
    if (Object.keys(additions).length) {
      await update(ref(this.db, `favorites/${uid}`), additions);
    }
  }
}
