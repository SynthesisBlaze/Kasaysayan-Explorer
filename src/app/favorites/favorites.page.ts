import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { trashOutline, bookmarksOutline, cloudOfflineOutline, createOutline, searchOutline } from 'ionicons/icons';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';
import { FavoritesService } from '../services/favorites.service';
import { UiFeedbackService } from '../services/ui-feedback.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, AppBarComponent],
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit, OnDestroy {
  showFilter = false;
  selectedCategory = 'All';
  categories = ['All', 'Places', 'Figures', 'Events', 'Periods'];

  favorites: any[] = [];

  searchTerm = '';

  readonly noteMaxLength = 140;
  noteModalOpen = false;
  noteTarget: any = null;
  noteDraft = '';
  savingNote = false;

  loading = true;
  loadError = false;

  private sub?: Subscription;

  constructor(
    private router: Router,
    private favoritesService: FavoritesService,
    private ui: UiFeedbackService
  ) {
    addIcons({ trashOutline, bookmarksOutline, cloudOfflineOutline, createOutline, searchOutline });
  }

  ngOnInit() {
    this.loadFavorites();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  loadFavorites() {
    this.sub?.unsubscribe();
    this.loading = true;
    this.loadError = false;

    this.sub = this.favoritesService.getFavorites().subscribe({
      next: (data) => {
        this.favorites = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Could not load favorites', err);
        this.loading = false;
        this.loadError = true;
        this.ui.error("Couldn't load your favorites. Check your connection and try again.", {
          text: 'Retry',
          handler: () => this.loadFavorites()
        });
      }
    });
  }

  toggleFilter() {
    this.showFilter = !this.showFilter;
  }

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.showFilter = false;
  }

  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      Places: 'location-outline',
      Figures: 'person-outline',
      Events: 'calendar-outline',
      Periods: 'time-outline',
    };
    return icons[category] || 'apps-outline';
  }

  get filteredFavorites() {
    const term = this.searchTerm.trim().toLowerCase();
    return this.favorites.filter(fav => {
      const inCategory = this.selectedCategory === 'All' || fav.category === this.selectedCategory;
      if (!inCategory) return false;
      if (!term) return true;
      return (
        (fav.name ?? '').toLowerCase().includes(term) ||
        (fav.category ?? '').toLowerCase().includes(term) ||
        (fav.note ?? '').toLowerCase().includes(term)
      );
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.detail?.value ?? '';
  }

  clearSearch() {
    this.searchTerm = '';
  }

  goExplore() {
    this.router.navigate(['/tabs/discover']);
  }

  async goToDetails(fav: any) {
    const route = fav.category.toLowerCase();
    this.router.navigate([`/${route}`, fav.id]);
  }

  async confirmRemove(fav: any, event: Event) {
    event.stopPropagation();

    const ok = await this.ui.confirm({
      header: 'Remove favorite?',
      message: `"${fav.name}" will be removed from your favorites.`,
      confirmText: 'Remove',
      destructive: true
    });
    if (!ok) return;

    await this.removeFavorite(fav);
  }

  private async removeFavorite(fav: any) {
    try {
      await this.favoritesService.removeFavorite(fav.id);
      this.ui.removed(`Removed "${fav.name}"`, {
        text: 'Undo',
        handler: () => this.restoreFavorite(fav)
      });
    } catch (err) {
      console.error('Remove favorite failed', err);
      this.ui.error("Couldn't remove this favorite. Check your connection and try again.", {
        text: 'Retry',
        handler: () => this.removeFavorite(fav)
      });
    }
  }

  private async restoreFavorite(fav: any) {
    try {
      await this.favoritesService.addFavorite({
        id: fav.id,
        name: fav.name,
        image: fav.image,
        category: fav.category,
        note: fav.note
      });
      this.ui.success('Favorite restored');
    } catch (err) {
      console.error('Restore favorite failed', err);
      this.ui.error("Couldn't restore this favorite. Please try again.");
    }
  }

  openNoteEditor(fav: any, event: Event) {
    event.stopPropagation();
    this.noteTarget = fav;
    this.noteDraft = fav.note ?? '';
    this.noteModalOpen = true;
  }

  closeNoteEditor() {
    this.noteModalOpen = false;
    this.noteTarget = null;
    this.noteDraft = '';
  }

  get noteTooLong(): boolean {
    return this.noteDraft.length > this.noteMaxLength;
  }

  get noteChanged(): boolean {
    return this.noteDraft.trim() !== (this.noteTarget?.note ?? '').trim();
  }

  get canSaveNote(): boolean {
    return !this.savingNote && !this.noteTooLong && this.noteChanged;
  }

  async saveNote() {
    if (!this.canSaveNote || !this.noteTarget) return;
    const fav = this.noteTarget;
    const note = this.noteDraft.trim();

    this.savingNote = true;
    try {
      await this.favoritesService.updateNote(fav.id, note);
      this.closeNoteEditor();
      this.ui.success(note ? 'Note saved' : 'Note removed');
    } catch (err) {
      console.error('Save note failed', err);
      this.ui.error("Couldn't save your note. Check your connection and try again.", {
        text: 'Retry',
        handler: () => this.saveNote()
      });
    } finally {
      this.savingNote = false;
    }
  }
}
