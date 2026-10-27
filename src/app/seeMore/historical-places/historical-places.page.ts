import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PlacesService } from '../../services/places.service';

@Component({
  selector: 'app-historical-places',
  templateUrl: './historical-places.page.html',
  styleUrls: ['./historical-places.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HistoricalPlacesPage implements OnInit, OnDestroy {
  places: any[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  private sub?: Subscription;

  constructor(
    private navCtrl: NavController,
    private placesService: PlacesService
  ) {}

  ngOnInit() {
    this.loadPlaces();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get filteredPlaces(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.places
      .filter((item) => !term || (item.name || '').toLowerCase().includes(term))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  loadPlaces() {
    this.loading = true;
    this.loadError = false;
    this.sub?.unsubscribe();
    setTimeout(() => {
      this.sub = this.placesService.getPlaces().subscribe({
        next: (data) => {
          this.places = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading places:', err);
          this.loading = false;
          this.loadError = true;
        }
      });
    }, 0);
  }

  onSearch(event: any) {
    this.searchTerm = event.detail.value || '';
  }

  goBack() {
    this.navCtrl.back();
  }

  openPlace(placeId: string) {
    this.navCtrl.navigateForward(`/places/${placeId}`);
  }
}
