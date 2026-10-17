import { Injectable } from '@angular/core';
import { Database, ref, objectVal } from '@angular/fire/database';
import { Observable, map} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PeriodsService {
  // --- Use constructor injection ---
  constructor(
    private db: Database
  ) {
    console.log('PeriodsService CONSTRUCTOR (Modular): Database injected?', !!this.db);
  }

  getPeriods(): Observable<any[]> {
    const periodsRef = ref(this.db, 'periods');
    return objectVal<any>(periodsRef).pipe(
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

  getPeriod(id: string): Observable<any> {
    console.log(`PeriodsService GETPERIOD(${id}) (Modular): Database available?`, !!this.db);
    const objRef = ref(this.db, 'periods/' + id);
    return objectVal<any>(objRef);
  }
}


