import { Component } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IonContent, IonButton, IonIcon, IonModal } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { compassOutline, personOutline, calendarOutline, timeOutline, imageOutline, locationOutline, listOutline, playOutline, chevronForwardOutline } from 'ionicons/icons';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';

interface QuizCategoryInfo {
  title: string;
  /** short line shown on the menu row */
  subtitle: string;
  instruction: string;
  icon: string;
  questions: number;
  type: string;
}

@Component({
  selector: 'app-quiz-menu',
  templateUrl: 'quizMenu.page.html',
  styleUrls: ['quizMenu.page.scss'],
  standalone: true,
  imports: [NgIf, NgFor, IonContent, IonButton, IonIcon, IonModal, AppBarComponent]
})
export class QuizMenuPage {

  constructor(
    private router: Router
  ) {
    // Add the icons including new ones for picture identification
    addIcons({
      compassOutline,
      personOutline,
      calendarOutline,
      timeOutline,
      imageOutline,
      locationOutline,
      listOutline,
      playOutline,
      chevronForwardOutline
    });
  }

  /** Category details shown in the modal (what the user is about to start). */
  private readonly categoryData: { [key: string]: QuizCategoryInfo } = {
    places: {
      subtitle: 'Landmarks and locations',
      title: 'Historical Places Quiz',
      instruction: 'Test your knowledge about famous landmarks, cities, and geographical locations around the world.',
      icon: 'compass-outline',
      questions: 10,
      type: 'Multiple choice'
    },
    figures: {
      subtitle: 'Heroes and leaders',
      title: 'Historical Figures Quiz',
      instruction: 'Challenge yourself with questions about influential people throughout history.',
      icon: 'person-outline',
      questions: 10,
      type: 'Multiple choice'
    },
    events: {
      subtitle: 'Battles and turning points',
      title: 'Historical Events Quiz',
      instruction: 'How well do you know important historical events? Put your knowledge to the test.',
      icon: 'calendar-outline',
      questions: 10,
      type: 'Multiple choice'
    },
    periods: {
      subtitle: 'Eras of Philippine history',
      title: 'Historical Periods Quiz',
      instruction: 'Explore different eras and time periods in history.',
      icon: 'time-outline',
      questions: 10,
      type: 'Multiple choice'
    },
    'picture-figures': {
      subtitle: 'Name the person in the portrait',
      title: 'Historical Figures Picture Quiz',
      instruction: 'Identify famous historical figures from their portraits and images.',
      icon: 'image-outline',
      questions: 5,
      type: 'Picture identification'
    },
    'picture-places': {
      subtitle: 'Recognize the landmark',
      title: 'Historical Places Picture Quiz',
      instruction: 'Recognize famous historical landmarks and places from images.',
      icon: 'location-outline',
      questions: 5,
      type: 'Picture identification'
    }
  };

  /** Menu layout: two groups of rows (data-driven, so adding a quiz is one line) */
  readonly groups = [
    {
      label: 'MULTIPLE CHOICE',
      meta: '10 questions each',
      keys: ['places', 'figures', 'events', 'periods']
    },
    {
      label: 'PICTURE QUIZ',
      meta: '5 questions each',
      keys: ['picture-figures', 'picture-places']
    }
  ];

  /** A short label for each row (the sheet shows the long title) */
  readonly rowTitles: { [key: string]: string } = {
    places: 'Places',
    figures: 'Figures',
    events: 'Events',
    periods: 'Periods',
    'picture-figures': 'Historical Figures',
    'picture-places': 'Historical Places'
  };

  info(key: string): QuizCategoryInfo {
    return this.categoryData[key];
  }

  isModalOpen = false;
  selectedKey = '';

  get selected(): QuizCategoryInfo | null {
    return this.categoryData[this.selectedKey] ?? null;
  }

  /** Opens the quiz details as a bottom sheet (easy to reach with a thumb, swipe down to dismiss). */
  openCategoryDialog(category: string) {
    this.selectedKey = category;
    this.isModalOpen = true;
  }

  /** Set by "Start Quiz": we navigate only AFTER the sheet has finished closing. */
  private pendingStart: string | null = null;

  /** Runs when the sheet has fully dismissed (Cancel, swipe down, backdrop tap, or Start Quiz). */
  closeModal() {
    this.isModalOpen = false;
    const key = this.pendingStart;
    this.pendingStart = null;
    if (key) {
      this.startQuiz(key);
    }
  }

  confirmStart() {
    // Closing first and navigating from the dismiss event stops the sheet getting stuck
    // on screen when the next page opens in the middle of its closing animation.
    this.pendingStart = this.selectedKey;
    this.isModalOpen = false;
  }

  /** Safety net: never leave the sheet open behind another page. */
  ionViewWillLeave() {
    this.isModalOpen = false;
  }

  startQuiz(category: string) {
    console.log(`Starting ${category} quiz`);
    
    // Check if it's a picture identification quiz
    if (category === 'picture-figures' || category === 'picture-places') {
      // Navigate to quiz2 page for picture identification
      this.router.navigate(['/quiz2'], { 
        queryParams: { category: category } 
      });
    } else {
      // Navigate to regular quiz page for multiple choice
      this.router.navigate(['/quiz'], { 
        queryParams: { category: category } 
      });
    }
  }
}