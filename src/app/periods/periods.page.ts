import { inject } from '@angular/core';
import { UiFeedbackService } from '../services/ui-feedback.service';
import { Component, OnInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';
import { PeriodsService } from '../services/periods.service';
import { take } from 'rxjs';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { FavoritesService } from '../services/favorites.service';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Component({
  standalone: true,
  selector: 'app-periods',
  templateUrl: './periods.page.html',
  styleUrls: ['./periods.page.scss'],
  imports: [
    CommonModule,
    IonicModule,
    FormsModule
  ]
})
export class PeriodsPage implements OnInit {
  private ui = inject(UiFeedbackService);
  periods: any = {};
  details: string[] = [];
  refs: string[] = [];

  public sheetTop = 300;
  public activeTab = 'bio';
  public showHandle = true;

  public isFav = false;
  public isSpeaking = false;
  public isLoading = true;

  public isDragging = false;
  private startY = 0;
  private startTopValue = 0;

  private initialSheetTop = 300;
  private minTop = 64;
  private readonly safeOffset = 84;

  private speechRate = 1;
  private speechPitch = 1;
  private speechVolume = 1;
  private preferredVoiceType: 'female' | 'male' | 'filipino' | 'default' = 'female';

  @ViewChild('period') periodRef!: ElementRef;
  @ViewChild('periodCaption') captionRef!: ElementRef;

  constructor(
    private favoritesService: FavoritesService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location,
    private periodsService: PeriodsService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.periodsService.getPeriod(id).pipe(take(1)).subscribe({
      next: (data) => {
        this.periods = data;
        this.details = this.toArray((data as any)?.details ?? (data as any)?.facts);
        this.refs = this.toArray((data as any)?.refs ?? (data as any)?.references);
        this.isLoading = false;
        console.log('Firebase data loaded:', data);

        const currentId = this.route.snapshot.paramMap.get('id') || this.periods.id;
        this.favoritesService.isFavorite(currentId).then((fav) => {
          this.isFav = !!fav;
        });

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
    if (this.isSpeaking) this.stopSpeak();
    const content = document.querySelector('.tab-content');
    if (content) content.scrollTop = 0;
  }

  public async toggleFavorite(): Promise<void> {
    const wasFav = this.isFav;
    this.isFav = !wasFav;
    const currentId = this.route.snapshot.paramMap.get('id') || this.periods.id;

    try {
      if (this.isFav) {
        await this.favoritesService.addFavorite({
          id: currentId,
          name: this.periods.name,
          image: this.periods.imgPath,
          category: 'Periods'
        });
        this.ui.success('Added to favorites');
      } else {
        await this.favoritesService.removeFavorite(currentId);
        this.ui.removed('Removed from favorites');
      }
    } catch (err) {
      console.error('Favorite update failed', err);
      this.isFav = wasFav;
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

    if (Math.abs(ev.clientY - this.startY) < 6) {
      this.setExpanded(this.startTopValue !== this.minTop);
      return;
    }

    const midpoint = (this.initialSheetTop + this.minTop) / 2;
    this.setExpanded(this.sheetTop <= midpoint);
  }

  public toggleSheet(): void {
    this.setExpanded(this.sheetTop !== this.minTop);
  }

  private setExpanded(expanded: boolean): void {
    this.sheetTop = expanded ? this.minTop : this.initialSheetTop;
    this.showHandle = !expanded;
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
        currentElement.classList.contains('period-back') ||
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
    const imageRatio = vh <= 640 ? 0.48 : 0.55;
    this.initialSheetTop = Math.round(vh * imageRatio - 16);
    if (this.sheetTop !== this.minTop) {
      this.sheetTop = this.initialSheetTop;
    }
  }

  private toArray(value: any): string[] {
    if (Array.isArray(value)) {
      return value.filter(v => v != null && v !== '');
    }
    if (value && typeof value === 'object') {
      return Object.values(value).filter(v => v != null && v !== '') as string[];
    }
    return [];
  }
}