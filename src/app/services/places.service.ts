
import { Injectable } from '@angular/core';
import { Database, ref, objectVal } from '@angular/fire/database';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlacesService {
  // --- Use constructor injection ---
  constructor(
    private db: Database
  ) {
    console.log('PlacesService CONSTRUCTOR (Modular): Database injected?', !!this.db);
  }

  getPlaces(): Observable<any[]> {
    const placesRef = ref(this.db, 'places');
    return objectVal<any>(placesRef).pipe(
      map(data => {
        if (!data) return [];
        // Convert the object to an array, preserving the key as the ID
        return Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
      })
    );
  }

  getPlace(id: string): Observable<any> {
    const objRef = ref(this.db, 'places/' + id);
    return objectVal<any>(objRef);
  }
}