import { inject } from '@angular/core';
import { UiFeedbackService } from '../services/ui-feedback.service';
import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PlacesService } from '../services/places.service';
import { take } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { FavoritesService } from '../services/favorites.service';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Component({
  standalone: true,
  selector: 'app-places',
  templateUrl: './places.page.html',
  styleUrls: ['./places.page.scss'],
  imports: [ // <-- 2. Add this 'imports' array
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class PlacesPage implements OnInit {
  private ui = inject(UiFeedbackService);
  places: any = {};
  details: string[] = [];
  refs: string[] = [];

  public sheetTop = 300;
  public activeTab = 'bio';
  public showHandle = true;

  public isLoading = true;
  // favorite / speech state
  public isFav = false;
  public isSpeaking = false;

  // dragging state
  public isDragging = false;
  private startY = 0;
  private startTopValue = 0;

  // peek/positions
  private initialSheetTop = 300;
  private minTop = 64;
  private readonly safeOffset = 84; // keep buttons above the sheet

  // Voice settings - SET TO FEMALE
  private speechRate = 1;
  private speechPitch = 1;
  private speechVolume = 1;
  private preferredVoiceType: 'female' | 'male' | 'filipino' | 'default' = 'female';

  @ViewChild('place') placeRef!: ElementRef;
  @ViewChild('placeCaption') captionRef!: ElementRef;

  constructor(
    private favoritesService: FavoritesService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private placesService: PlacesService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // Fetch only once and wait until data is ready
    this.placesService.getPlace(id).pipe(take(1)).subscribe({
      next: (data) => {
        this.places = data;
        this.details = this.toArray((data as any)?.details ?? (data as any)?.facts); // DB field is now "details" (falls back to old "facts")
        this.refs = this.toArray((data as any)?.refs ?? (data as any)?.references);
        this.isLoading = false; // Mark loaded
        console.log('Firebase data loaded:', data);

        // reflect persisted favorite state
        const currentId = this.route.snapshot.paramMap.get('id') || this.places.id;
        this.favoritesService.isFavorite(currentId).then((fav) => {
          this.isFav = !!fav;
        });

        // set sheet position based on viewport height (no DOM measuring)
        setTimeout(() => this.setSheetTopByViewport(), 0);
      },
      error: (err) => {
        console.error('Error loading event:', err);
        this.isLoading = false;
      },
    });
  }

  public setTab(tab?: string | number): void {
    this.activeTab = (tab ?? 'bio').toString();
    setTimeout(() => {
      this.showHandle = true;
      this.sheetTop = this.initialSheetTop;
    }, 0);
  }

  // favorite toggle
  // Favorite toggle with HCI-minded feedback:
  //  - optimistic update: the heart changes instantly (visibility of system status)
  //  - success toast confirms the action
  //  - on failure we roll the heart back and offer Retry (error recovery)
  public async toggleFavorite(): Promise<void> {
    const wasFav = this.isFav;
    this.isFav = !wasFav;
    const currentId = this.route.snapshot.paramMap.get('id') || this.places.id;

    try {
      if (this.isFav) {
        await this.favoritesService.addFavorite({
          id: currentId,
          name: this.places.name,
          image: this.places.imgPath,
          category: 'Places'
        });
        this.ui.success('Added to favorites');
      } else {
        await this.favoritesService.removeFavorite(currentId);
        this.ui.removed('Removed from favorites');
      }
    } catch (err) {
      console.error('Favorite update failed', err);
      this.isFav = wasFav; // never leave the UI showing something that did not happen
      this.ui.error(
        "Couldn't update your favorites. Check your connection and try again.",
        { text: 'Retry', handler: () => this.toggleFavorite() }
      );
    }
  }

  async showToast(message: string) {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 1500;
    toast.color = 'success';
    document.body.appendChild(toast);
    await toast.present();
  }

  // speech toggle
  public toggleSpeak(): void {
    if (this.isSpeaking) {
      this.stopSpeak();
    } else {
      this.startSpeak();
    }
  }

  private startSpeak(): void {
    const el = document.querySelector('.tab-content') as HTMLElement | null;
    let text = '';
    if (this.activeTab === 'bio') {
      const bioEl = el ? el.querySelector('.text') as HTMLElement | null : null;
      text = bioEl ? bioEl.innerText.trim() : (el ? el.innerText.trim() : '');
    } else {
      text = el ? el.innerText.trim() : '';
    }
    if (!text) return;

    this.isSpeaking = true;
    TextToSpeech.speak({
      text,
      lang: 'fil-PH',
      rate: 1.0,
      pitch: 1.0,
      volume: 1.0,
      category: 'ambient'
    } as any).then(() => {
      this.isSpeaking = false;
    }).catch(err => {
      console.error('Native TTS error:', err);
      this.isSpeaking = false;
    });
  }

  private setVoiceByPreference(): void {}

  private stopSpeak(): void {
    try { (TextToSpeech as any).stop?.(); } catch {}
    this.isSpeaking = false;
  }

  // --- Drag handlers (entire sheet drag) ---
  public startDrag(ev: PointerEvent): void {
    if (ev.button && ev.button !== 0) return;

    const target = ev.target as HTMLElement;
    if (this.isInteractiveElement(target)) {
      return;
    }

    ev.preventDefault();
    ev.stopPropagation();
    this.isDragging = true;
    this.startY = ev.clientY;
    this.startTopValue = this.sheetTop;

    try { document.body.style.overflow = 'hidden'; } catch { }
    try { (ev.currentTarget as any).setPointerCapture(ev.pointerId); } catch { }
  }

  public onDrag(ev: PointerEvent): void {
    if (!this.isDragging) return;
    const delta = ev.clientY - this.startY;
    const candidate = this.startTopValue + delta;
    this.sheetTop = Math.min(Math.max(candidate, this.minTop), this.initialSheetTop);
    this.showHandle = this.sheetTop >= (this.initialSheetTop - 8);
  }

  public endDrag(ev: PointerEvent): void {
    if (!this.isDragging) return;
    this.isDragging = false;
    try { document.body.style.overflow = ''; } catch { }
    try { (ev.currentTarget as any).releasePointerCapture(ev.pointerId); } catch { }

    const midpoint = (this.initialSheetTop + this.minTop) / 2;
    if (this.sheetTop <= midpoint) {
      this.sheetTop = this.minTop;
      this.showHandle = false;
    } else {
      this.sheetTop = this.initialSheetTop;
      this.showHandle = true;
    }
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    let currentElement: HTMLElement | null = element;

    while (currentElement) {
      const tagName = currentElement.tagName.toLowerCase();
      const isInteractive =
        tagName === 'button' ||
        tagName === 'a' ||
        tagName === 'input' ||
        tagName === 'select' ||
        tagName === 'textarea' ||
        currentElement.classList.contains('fav') ||
        currentElement.classList.contains('speak') ||
        currentElement.classList.contains('place-back') ||
        currentElement.closest('ion-segment-button') !== null;

      if (isInteractive) {
        return true;
      }

      if (currentElement.classList.contains('sheet')) {
        break;
      }

      currentElement = currentElement.parentElement;
    }

    return false;
  }

  public goBack(): void {
    this.location.back();
  }

  private setSheetTopByViewport(): void {
    const vh = Math.max(320, Math.min(window.innerHeight || 640, 2000));
    this.initialSheetTop = Math.round(vh * 0.55 + 12);
    if (this.sheetTop !== this.minTop) {
      this.sheetTop = this.initialSheetTop;
    }
  }

  // Normalize Firebase values (array or object) to a string array
  private toArray(value: any): string[] {
    const pickString = (v: any): string | null => {
      if (v == null) return null;
      if (typeof v === 'string') return v.trim();
      if (typeof v === 'object') {
        const cand = (v as any).url || (v as any).link || (v as any).reference || (v as any).text || (v as any).title;
        if (typeof cand === 'string') return cand.trim();
        const firstStr = Object.values(v).find(x => typeof x === 'string') as string | undefined;
        if (firstStr) return firstStr.trim();
        try { return JSON.stringify(v); } catch { return null; }
      }
      return String(v);
    };

    if (Array.isArray(value)) {
      return value.map(pickString).filter((s): s is string => !!s && s.length > 0);
    }
    if (value && typeof value === 'object') {
      return Object.values(value).map(pickString).filter((s): s is string => !!s && s.length > 0);
    }
    return [];
  }
}