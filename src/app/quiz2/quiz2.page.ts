// quiz2.page.ts - Complete with back navigation handling
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, Platform } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { addIcons } from 'ionicons';
import { QuizScoresService } from '../services/quiz-scores.service';
import {
  arrowBackOutline,
  checkmarkCircle,
  closeCircle,
  chevronBackOutline,
  chevronForwardOutline,
  refreshOutline,
  homeOutline,
  pencilOutline,
  checkmarkCircleOutline
} from 'ionicons/icons';

interface QuizQuestion {
  image: string;
  question: string;
  answer: string;
  figureName: string;
  explanation: string;
}

interface QuizResult {
  image: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  figureName: string;
}

@Component({
  selector: 'app-quiz2',
  templateUrl: './quiz2.page.html',
  styleUrls: ['./quiz2.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class Quiz2Page implements OnInit {
  currentCategory: string = '';
  currentQuestion: number = 0;
  userAnswer: string = '';
  userAnswerParts: string[] = [];
  score: number = 0;
  totalQuestions: number = 5;
  answered: boolean = false;
  showFeedback: boolean = false;
  isCorrect: boolean = false;
  quizCompleted: boolean = false;
  quizResults: QuizResult[] = [];

  /** Which quiz this is, as saved with the account's best score. */
  private quizKey = '';

  /** What happened to the score after the quiz ended (shown on the results screen). */
  saveNote = '';
  saveStatus: 'none' | 'guest' | 'saved' | 'error' = 'none';

  figuresQuestions: QuizQuestion[] = [
    {
      image: 'assets/rizal.webp',
      question: 'Identify this national hero known for his novels Noli Me Tangere and El Filibusterismo, which inspired the Philippine Revolution.',
      answer: 'Dr Jose Rizal',
      figureName: 'Dr Jose Rizal',
      explanation: 'Dr Jose Rizal is the Philippines\' national hero whose writings inspired the revolution against Spanish colonial rule.'
    },
    {
      image: 'assets/bonifacio.jpg',
      question: 'Known as the "Father of the Philippine Revolution," he founded the Katipunan movement. Who is he?',
      answer: 'Andres Bonifacio',
      figureName: 'Andres Bonifacio',
      explanation: 'Andres Bonifacio founded the Katipunan, a secret society that sparked the Philippine Revolution in 1896.'
    },
    {
      image: 'assets/aguinaldo.jpg',
      question: 'He was the first President of the Philippines and led the declaration of independence in 1898. Identify him.',
      answer: 'Emilio Aguinaldo',
      figureName: 'Emilio Aguinaldo',
      explanation: 'Emilio Aguinaldo was the first President of the Philippines and proclaimed independence from Spain on June 12, 1898.'
    },
    {
      image: 'assets/mabini.jpg',
      question: 'Known as "The Brain of the Revolution," he served as Aguinaldo\'s adviser and wrote the True Decalogue. Who is he?',
      answer: 'Apolinario Mabini',
      figureName: 'Apolinario Mabini',
      explanation: 'Apolinario Mabini was a revolutionary leader and political philosopher who served as Prime Minister and foreign minister.'
    },
    {
      image: 'assets/silang.jpg',
      question: 'She was a courageous woman leader who continued the fight for freedom after her husband Diego\'s death. Who is she?',
      answer: 'Gabriela Silang',
      figureName: 'Gabriela Silang',
      explanation: 'Gabriela Silang led the Ilocano independence movement after her husband\'s execution, becoming the first Filipino woman to lead a revolt.'
    }
  ];

  placesQuestions: QuizQuestion[] = [
    {
      image: 'assets/monument.jpg',
      question: 'Identify this monument built in honor of the Philippine national hero who was executed in Bagumbayan in 1896.',
      answer: 'Rizal Monument',
      figureName: 'Rizal Monument',
      explanation: 'The Rizal Monument in Luneta Park commemorates Dr. José Rizal, who was executed by the Spanish colonial government.'
    },
    {
      image: 'assets/church.jpg',
      question: 'This church was the site of the First Philippine Congress and the drafting of the Malolos Constitution. What is its name?',
      answer: 'Barasoain Church',
      figureName: 'Barasoain Church',
      explanation: 'Barasoain Church in Malolos, Bulacan served as the venue for the First Philippine Republic Congress in 1898.'
    },
    {
      image: 'assets/house.jpg',
      question: 'Identify this leader who declared Philippine independence on June 12, 1898, in Kawit, Cavite.',
      answer: 'Emilio Aguinaldo',
      figureName: 'Emilio Aguinaldo',
      explanation: 'This is the ancestral home of Emilio Aguinaldo where Philippine independence was proclaimed in 1898.'
    },
    {
      image: 'assets/edsa.jpg',
      question: 'This monument commemorates the peaceful 1986 revolution that ended the Marcos regime. What is this monument called?',
      answer: 'EDSA People Power Monument',
      figureName: 'EDSA People Power Monument',
      explanation: 'The EDSA People Power Monument commemorates the 1986 revolution that restored democracy in the Philippines.'
    },
    {
      image: 'assets/fort.jpg',
      question: 'This fortress served as a Spanish military base and prison for Filipino revolutionaries, including José Rizal. Identify this place.',
      answer: 'Fort Santiago',
      figureName: 'Fort Santiago',
      explanation: 'Fort Santiago in Intramuros was a Spanish fortress that served as a prison for revolutionaries, including José Rizal before his execution.'
    }
  ];

  private backButtonSubscription: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController,
    private platform: Platform,
    private quizScores: QuizScoresService
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkCircle,
      closeCircle,
      chevronBackOutline,
      chevronForwardOutline,
      refreshOutline,
      homeOutline,
      pencilOutline,
      checkmarkCircleOutline
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const category = params['category'];

      // Reset quiz state when category changes
      this.currentQuestion = 0;
      this.userAnswer = '';
      this.userAnswerParts = [];
      this.score = 0;
      this.answered = false;
      this.showFeedback = false;
      this.isCorrect = false;
      this.quizCompleted = false;
      this.quizResults = [];
      this.saveNote = '';
      this.saveStatus = 'none';

      if (category === 'picture-figures') {
        this.quizKey = 'picture-figures';
        this.currentCategory = 'Historical Figures';
      } else if (category === 'picture-places') {
        this.quizKey = 'picture-places';
        this.currentCategory = 'Historical Places';
      } else {
        this.router.navigate(['/']);
      }

      this.initializeAnswerParts();
    });
  }

  ionViewDidEnter() {
    // Handle hardware back button
    this.backButtonSubscription = this.platform.backButton.subscribeWithPriority(10, () => {
      this.handleBackNavigation();
    });
  }

  ionViewWillLeave() {
    // Remove back button handler
    if (this.backButtonSubscription) {
      this.backButtonSubscription.unsubscribe();
    }
  }

  // Handle browser back button/gesture
  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (!this.quizCompleted) {
      event.preventDefault();
      this.handleBackNavigation();
    }
  }

  handleBackNavigation() {
    if (this.quizCompleted) {
      // If quiz is completed, go back to categories
      this.goHome();
      return;
    }

    if (this.currentQuestion > 0 && !this.answered) {
      // Go to previous question
      this.previousQuestion();
    } else if (this.answered) {
      // If answered, show alert
      this.showBackAlert();
    } else {
      // If on first question, confirm exit
      this.confirmExitQuiz();
    }
  }

  private async showBackAlert() {
    const alert = await this.alertController.create({
      header: 'Cannot Go Back',
      message: 'You cannot go back to previous questions after submitting an answer.',
      buttons: ['OK']
    });
    await alert.present();
  }

  private async confirmExitQuiz() {
    const alert = await this.alertController.create({
      header: 'Exit Quiz?',
      message: 'Are you sure you want to exit? Your progress will be lost.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Exit',
          handler: () => {
            this.goHome();
          }
        }
      ]
    });
    await alert.present();
  }

  initializeAnswerParts() {
    const currentQ = this.getCurrentQuestion();
    const answerWords = currentQ.answer.split(' ');
    this.userAnswerParts = new Array(answerWords.length).fill('');
  }

  getAnswerParts(): string[] {
    return this.getCurrentQuestion().answer.split(' ');
  }

  isAllInputsFilled(): boolean {
    return this.userAnswerParts.every(part => part && part.trim().length > 0);
  }
  
  calculateInputWidth(word: string): number {
    const wordLength = word.length;

    if (wordLength <= 2) return 60;
    if (wordLength <= 4) return 80;
    if (wordLength <= 6) return 100;
    if (wordLength <= 8) return 120;
    return 140; // For words longer than 8 characters
  }

  updateUserAnswer() {
    this.userAnswer = this.userAnswerParts.join(' ').trim();
  }

  getCurrentQuestion(): QuizQuestion {
    const questions = this.currentCategory === 'Historical Figures'
      ? this.figuresQuestions
      : this.placesQuestions;
    return questions[this.currentQuestion];
  }

  checkAnswer() {
    this.updateUserAnswer();

    if (!this.isAllInputsFilled() || this.answered) return;

    this.answered = true;
    const currentQ = this.getCurrentQuestion();

    const correctAnswer = currentQ.answer.toLowerCase();
    const userAnswer = this.userAnswer.toLowerCase().trim();

    this.isCorrect = userAnswer === correctAnswer;

    if (this.isCorrect) {
      this.score++;
    }

    this.quizResults.push({
      image: currentQ.image,
      question: currentQ.question,
      userAnswer: this.userAnswer,
      correctAnswer: currentQ.answer,
      isCorrect: this.isCorrect,
      figureName: currentQ.figureName
    });
  }

  nextQuestion() {
    this.answered = false;
    this.userAnswer = '';
    this.userAnswerParts = [];

    if (this.currentQuestion < this.totalQuestions - 1) {
      this.currentQuestion++;
      this.initializeAnswerParts();
    } else {
      this.quizCompleted = true;
      void this.saveScore();
    }
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

  previousQuestion() {
    if (this.currentQuestion > 0) {
      this.currentQuestion--;
      this.userAnswer = '';
      this.answered = false;
      this.initializeAnswerParts();
    }
  }

  calculatePercentage(): number {
    return (this.score / this.totalQuestions) * 100;
  }

  getPerformanceText(): string {
    const percentage = this.calculatePercentage();
    if (percentage >= 90) return 'Excellent!';
    if (percentage >= 70) return 'Good job!';
    if (percentage >= 50) return 'Average';
    return 'Need more practice';
  }

  getExplanation(correctAnswer: string): string {
    const explanations: { [key: string]: string } = {
      'Dr Jose Rizal': 'Dr. Jose Rizal is the Philippines\' national hero whose writings inspired the revolution against Spanish colonial rule.',
      'Andres Bonifacio': 'Andres Bonifacio founded the Katipunan, a secret society that sparked the Philippine Revolution in 1896.',
      'Emilio Aguinaldo': 'Emilio Aguinaldo was the first President of the Philippines and proclaimed independence from Spain on June 12, 1898.',
      'Apolinario Mabini': 'Apolinario Mabini was a revolutionary leader and political philosopher who served as Prime Minister and foreign minister.',
      'Gabriela Silang': 'Gabriela Silang led the Ilocano independence movement after her husband\'s execution, becoming the first Filipino woman to lead a revolt.',
      'Rizal Monument': 'The Rizal Monument in Luneta Park commemorates Dr. José Rizal, who was executed by the Spanish colonial government.',
      'Barasoain Church': 'Barasoain Church in Malolos, Bulacan served as the venue for the First Philippine Republic Congress in 1898.',
      'EDSA People Power Monument': 'The EDSA People Power Monument commemorates the 1986 revolution that restored democracy in the Philippines.',
      'Fort Santiago': 'Fort Santiago in Intramuros was a Spanish fortress that served as a prison for revolutionaries, including José Rizal before his execution.'
    };

    return explanations[correctAnswer] || 'This is an important historical figure/place in Philippine history.';
  }

  async retryQuiz() {
    const alert = await this.alertController.create({
      header: 'Retry Quiz',
      message: 'Are you sure you want to restart this quiz?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Try Again',
          handler: () => {
            this.resetQuiz();
          }
        }
      ]
    });

    await alert.present();
  }

  resetQuiz() {
    this.currentQuestion = 0;
    this.score = 0;
    this.userAnswer = '';
    this.userAnswerParts = [];
    this.answered = false;
    this.showFeedback = false;
    this.quizCompleted = false;
    this.quizResults = [];
    this.saveNote = '';
    this.saveStatus = 'none';
    this.initializeAnswerParts();
  }

  goBack() {
    if (this.currentQuestion > 0 && !this.quizCompleted) {
      this.currentQuestion--;
      this.userAnswer = '';
      this.answered = false;
      this.initializeAnswerParts();
    } else {
      this.router.navigate(['/']);
    }
  }

  goHome() {
    this.router.navigate(['tabs/quizMenu']);
  }
}