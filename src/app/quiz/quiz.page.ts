// quiz.page.ts - multiple-choice quiz with instant feedback and a review-style results screen
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonFooter, Platform } from '@ionic/angular/standalone';
import { QuizService, Question, QuizResult } from './quiz.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UiFeedbackService } from '../services/ui-feedback.service';
import { QuizScoresService } from '../services/quiz-scores.service';

const MULTIPLE_CHOICE_QUIZZES = ['places', 'figures', 'events', 'periods'];

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.page.html',
  styleUrls: ['./quiz.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonFooter]
})
export class QuizPage implements OnInit {
  questions: Question[] = [];
  currentQuestionIndex = 0;
  userAnswers: (number | null)[] = [];
  /** true once the student pressed "Check answer" for that question (answer is then locked) */
  revealed: boolean[] = [];
  showResults = false;
  quizResults: QuizResult[] = [];
  score = 0;
  totalQuestions = 0;
  percentage = 0;
  categoryLabel = '';
  /** Which quiz this is, as saved with the account's best score. */
  private quizKey = 'places';

  /** What happened to the score after the quiz ended (shown on the results screen). */
  saveNote = '';
  saveStatus: 'none' | 'guest' | 'saved' | 'error' = 'none';

  /** Results screen: which review row is open, and whether the whole list is shown */
  expandedReview: number | null = null;
  showAllReview = false;
  readonly reviewPreviewCount = 3;

  private backButtonSubscription: any;

  constructor(
    private quizService: QuizService,
    private ui: UiFeedbackService,
    private quizScores: QuizScoresService,
    private router: Router,
    private route: ActivatedRoute,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const category = params['category'] || 'Places';
      const requested = String(category).toLowerCase();
      this.quizKey = MULTIPLE_CHOICE_QUIZZES.includes(requested) ? requested : 'places';
      this.categoryLabel = String(category).toUpperCase();
      this.questions = this.quizService.getQuestionsByCategory(category);
      this.resetState();
    });
  }

  private resetState() {
    this.currentQuestionIndex = 0;
    this.userAnswers = new Array(this.questions.length).fill(null);
    this.revealed = new Array(this.questions.length).fill(false);
    this.showResults = false;
    this.quizResults = [];
    this.score = 0;
    this.totalQuestions = 0;
    this.percentage = 0;
    this.expandedReview = null;
    this.showAllReview = false;
    this.saveNote = '';
    this.saveStatus = 'none';
  }

  ionViewDidEnter() {
    // Handle hardware back button
    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(10, () => {
      this.handleBackNavigation();
    });
  }

  ionViewWillLeave() {
    if (this.backButtonSubscription) {
      this.backButtonSubscription.unsubscribe();
    }
  }

  // Handle browser back button/gesture
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (!this.showResults) {
      event.preventDefault();
      this.handleBackNavigation();
    }
  }

  handleBackNavigation() {
    if (this.showResults) {
      this.goHome();
      return;
    }
    if (this.currentQuestionIndex > 0) {
      this.previousQuestion();
    } else {
      this.confirmExitQuiz();
    }
  }

  /** Close (X) button and first-question back: ask before throwing progress away. */
  async confirmExitQuiz() {
    const ok = await this.ui.confirm({
      header: 'Exit quiz?',
      message: 'Your progress will be lost.',
      confirmText: 'Exit',
      cancelText: 'Keep going',
      destructive: true
    });
    if (ok) {
      this.goHome();
    }
  }

  // ---------------------------------------------------------------------------
  // Current question
  // ---------------------------------------------------------------------------
  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  get isLastQuestion(): boolean {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  get isFirstQuestion(): boolean {
    return this.currentQuestionIndex === 0;
  }

  get selectedIndex(): number | null {
    return this.userAnswers[this.currentQuestionIndex] ?? null;
  }

  get isRevealed(): boolean {
    return !!this.revealed[this.currentQuestionIndex];
  }

  get isCorrectNow(): boolean {
    return this.selectedIndex === this.currentQuestion.correctAnswer;
  }

  /** Check button stays disabled until something is selected (no "no answer" alert needed). */
  get canCheck(): boolean {
    return this.selectedIndex !== null && !this.isRevealed;
  }

  /** Progress segment is filled for finished questions (and the current one once answered). */
  segmentDone(i: number): boolean {
    return i < this.currentQuestionIndex || (i === this.currentQuestionIndex && this.isRevealed);
  }

  optionState(i: number): string {
    if (this.isRevealed) {
      if (i === this.currentQuestion.correctAnswer) return 'correct';
      if (i === this.selectedIndex) return 'wrong';
      return 'dim';
    }
    return this.selectedIndex === i ? 'selected' : '';
  }

  selectAnswer(optionIndex: number) {
    if (this.isRevealed) return; // locked after checking
    this.userAnswers[this.currentQuestionIndex] = optionIndex;
  }

  checkAnswer() {
    if (!this.canCheck) return;
    this.revealed[this.currentQuestionIndex] = true;
  }

  async continueQuiz() {
    if (!this.isRevealed) return;
    if (this.isLastQuestion) {
      this.submitQuiz();
    } else {
      this.currentQuestionIndex++;
    }
  }

  previousQuestion() {
    if (!this.isFirstQuestion) {
      this.currentQuestionIndex--;
    }
  }

  submitQuiz() {
    this.quizResults = this.questions.map((question, index) => {
      const userAnswer = this.userAnswers[index];
      return {
        question: question.question,
        userAnswer: userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: userAnswer === question.correctAnswer,
        options: question.options,
        explanation: question.explanation
      };
    });

    const scoreResult = this.quizService.calculateScore(this.quizResults);
    this.score = scoreResult.score;
    this.totalQuestions = scoreResult.total;
    this.percentage = scoreResult.percentage;
    this.expandedReview = null;
    this.showAllReview = false;
    this.showResults = true;
    void this.saveScore();
  }

  /** Signed-in accounts keep their highest score; guests can play but nothing is saved. */
  private async saveScore() {
    const result = await this.quizScores.saveScore(this.quizKey, this.score, this.totalQuestions);
    if (result.status === 'guest') {
      this.saveStatus = 'guest';
      this.saveNote = 'Sign in to save your best score.';
    } else if (result.status === 'error') {
      this.saveStatus = 'error';
      this.saveNote = "Couldn't save your score right now.";
    } else {
      this.saveStatus = 'saved';
      this.saveNote = !result.isNewBest
        ? `Your best score is ${result.best}/${result.total}.`
        : result.firstScore
          ? 'Score saved to your account.'
          : 'New best! Saved to your account.';
    }
  }

  goToAccount() {
    this.router.navigate(['/tabs/account']);
  }

  // ---------------------------------------------------------------------------
  // Results
  // ---------------------------------------------------------------------------
  get missed(): number {
    return this.totalQuestions - this.score;
  }

  /** Score ring: stroke-dasharray for a circle of radius 74 */
  get ringDash(): string {
    const circumference = 2 * Math.PI * 74;
    return `${(this.percentage / 100) * circumference} ${circumference}`;
  }

  get performanceTitle(): string {
    const p = this.percentage;
    return p >= 90 ? 'Excellent!' : p >= 70 ? 'Good job!' : p >= 50 ? 'Not bad!' : 'Keep practicing!';
  }

  get performanceHint(): string {
    return this.missed > 0 ? 'Review what you missed, then try again.' : 'You got every question right.';
  }

  toggleReview(i: number) {
    this.expandedReview = this.expandedReview === i ? null : i;
  }

  restartQuiz() {
    this.resetState();
  }

  goHome() {
    this.router.navigate(['tabs/quizMenu']);
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D
  }
}
