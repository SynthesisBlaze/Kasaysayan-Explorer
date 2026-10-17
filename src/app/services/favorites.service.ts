import { Injectable, inject } from '@angular/core';
import { Database, ref, set, update, remove, get, objectVal } from '@angular/fire/database';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private db = inject(Database);
  
  constructor() {}

  // ✅ Get all favorites
  getFavorites(): Observable<any[]> {
    const favRef = ref(this.db, 'favorites');
    return objectVal<any>(favRef).pipe(
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
  addFavorite(item: any) {
    const itemRef = ref(this.db, `favorites/${item.id}`);
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
  updateNote(itemId: string, note: string) {
    const itemRef = ref(this.db, `favorites/${itemId}`);
    // `null` deletes the field in Firebase, so an empty note leaves no clutter behind
    return update(itemRef, { note: note.trim() ? note.trim() : null });
  }

  // ✅ Remove favorite by item ID
  removeFavorite(itemId: string) {
    const itemRef = ref(this.db, `favorites/${itemId}`);
    return remove(itemRef);
  }

  // ✅ Check if an item is already a favorite
  async isFavorite(itemId: string): Promise<boolean> {
    if (!this.db) {
      console.error('Database not initialized');
      return false;
    }
    try {
      const snapshot = await get(ref(this.db, `favorites/${itemId}`));
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }
}
