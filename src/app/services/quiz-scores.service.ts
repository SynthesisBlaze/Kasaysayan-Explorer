import { Injectable, inject } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Database, get, objectVal, ref, serverTimestamp, set } from '@angular/fire/database';
import { Observable, distinctUntilChanged, map, of, switchMap } from 'rxjs';

export interface QuizInfo {
  /** The id used in the quiz page links and in the database. */
  key: string;
  title: string;
  type: string;
}

/** Every quiz that keeps a best score, in the order they are listed on the Account page. */
export const QUIZ_CATALOG: QuizInfo[] = [
  { key: 'places', title: 'Places', type: 'Multiple choice' },
  { key: 'figures', title: 'Figures', type: 'Multiple choice' },
  { key: 'events', title: 'Events', type: 'Multiple choice' },
  { key: 'periods', title: 'Periods', type: 'Multiple choice' },
  { key: 'picture-figures', title: 'Historical Figures', type: 'Picture quiz' },
  { key: 'picture-places', title: 'Historical Places', type: 'Picture quiz' }
];

/** The highest score someone has reached on one quiz. */
export interface QuizBest {
  best: number;
  total: number;
}

export type ScoreSaveResult =
  | { status: 'guest' }
  | { status: 'error' }
  | { status: 'saved'; best: number; total: number; isNewBest: boolean; firstScore: boolean };

@Injectable({
  providedIn: 'root'
})
export class QuizScoresService {
  private db = inject(Database);
  private auth = inject(AngularFireAuth);

  /**
   * Saves a finished quiz for the signed-in account, keeping only its highest score.
   * Guests can take every quiz, but nothing is saved for them.
   */
  async saveScore(quizKey: string, score: number, total: number): Promise<ScoreSaveResult> {
    const user = await this.auth.currentUser;
    if (!user || user.isAnonymous) {
      return { status: 'guest' };
    }

    try {
      const node = ref(this.db, `quizScores/${user.uid}/${quizKey}`);
      const current: unknown = (await get(node)).val();
      const saved = current as Partial<QuizBest> | null;
      const previousBest = typeof saved?.best === 'number' ? saved.best : null;

      if (previousBest !== null && score <= previousBest) {
        return {
          status: 'saved',
          best: previousBest,
          total: typeof saved?.total === 'number' ? saved.total : total,
          isNewBest: false,
          firstScore: false
        };
      }

      await set(node, { best: score, total, updatedAt: serverTimestamp() });
      return { status: 'saved', best: score, total, isNewBest: true, firstScore: previousBest === null };
    } catch (error) {
      console.error('Could not save the quiz score:', error);
      return { status: 'error' };
    }
  }

  /** The signed-in account's best score for each quiz, kept up to date as scores change. */
  getBestScores(): Observable<Record<string, QuizBest>> {
    return this.auth.authState.pipe(
      map(user => (user && !user.isAnonymous ? user.uid : null)),
      distinctUntilChanged(),
      switchMap(uid => (uid ? objectVal<Record<string, QuizBest>>(ref(this.db, `quizScores/${uid}`)) : of(null))),
      map(value => {
        const scores: Record<string, QuizBest> = {};
        for (const quiz of QUIZ_CATALOG) {
          const entry = value?.[quiz.key];
          if (entry && typeof entry.best === 'number' && typeof entry.total === 'number') {
            scores[quiz.key] = { best: entry.best, total: entry.total };
          }
        }
        return scores;
      })
    );
  }
}
