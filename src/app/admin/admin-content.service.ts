import { inject, Injectable } from '@angular/core';
import { Database, get, ref, remove, set } from '@angular/fire/database';

export type AdminCollection = 'periods' | 'events' | 'figures' | 'places';

export interface AdminRecord {
  id: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class AdminContentService {
  private database = inject(Database);

  /**
   * An account is an administrator when its profile role is `admin`
   * (`users/<uid>/role`) or it is listed under the older `admins/<uid>` marker.
   */
  async isAdmin(uid: string): Promise<boolean> {
    const [legacyMarker, profileRole] = await Promise.all([
      get(ref(this.database, `admins/${uid}`)),
      // Accounts created before roles existed have no profile; a failed read
      // here must not lock out accounts that are still admins through `admins`.
      get(ref(this.database, `users/${uid}/role`)).catch(error => {
        console.warn('Could not read the account role:', error);
        return null;
      })
    ]);
    return legacyMarker.val() === true || profileRole?.val() === 'admin';
  }

  async getRecords(collection: AdminCollection): Promise<AdminRecord[]> {
    const snapshot = await get(ref(this.database, collection));
    const data: unknown = snapshot.val();

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return [];
    }

    return Object.entries(data)
      .filter((entry): entry is [string, Record<string, unknown>] =>
        !!entry[1] && typeof entry[1] === 'object' && !Array.isArray(entry[1]))
      .map(([id, value]): AdminRecord => ({ ...value, id }))
      .sort((first, second) =>
        String(first['name'] ?? '').localeCompare(String(second['name'] ?? '')));
  }

  saveRecord(collection: AdminCollection, id: string, value: Record<string, unknown>): Promise<void> {
    return set(ref(this.database, `${collection}/${id}`), value);
  }

  deleteRecord(collection: AdminCollection, id: string): Promise<void> {
    return remove(ref(this.database, `${collection}/${id}`));
  }
}
