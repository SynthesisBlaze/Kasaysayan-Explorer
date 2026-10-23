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

  async isAdmin(uid: string): Promise<boolean> {
    const snapshot = await get(ref(this.database, `admins/${uid}`));
    return snapshot.val() === true;
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
