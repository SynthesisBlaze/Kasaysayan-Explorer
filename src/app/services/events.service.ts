import { Injectable, inject } from '@angular/core';
import { Database, ref, objectVal } from '@angular/fire/database';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private db = inject(Database);
  
  constructor() {
    console.log('EventsService initialized. Database connected?', !!this.db);
  }

  /** Get all events from /events */
  getEvents(): Observable<any[]> {
    const eventsRef = ref(this.db, 'events');
    return objectVal<any>(eventsRef).pipe(
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

  /** Get single event by ID */
  getEvent(id: string): Observable<any> {
    if (!this.db) {
      console.error('Database not initialized');
      return new Observable(observer => {
        observer.error('Database not initialized');
      });
    }
    const objRef = ref(this.db, `events/${id}`);
    return objectVal<any>(objRef);
  }
}
