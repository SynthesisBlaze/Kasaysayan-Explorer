
import { Injectable } from '@angular/core';
import { Database, ref, objectVal } from '@angular/fire/database';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FiguresService {
  // --- Use constructor injection ---
  constructor(
    private db: Database
  ) {
    console.log('FiguresService CONSTRUCTOR (Modular): Database injected?', !!this.db);
  }

  getFigures(): Observable<any[]> {
    const figuresRef = ref(this.db, 'figures');
    return objectVal<any>(figuresRef).pipe(
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

  getFigure(id: string): Observable<any> {
    const objRef = ref(this.db, 'figures/' + id);
    return objectVal<any>(objRef);
  }
}