import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { PlacesService } from '../../services/places.service';


@Component({
  selector: 'app-historical-places',
  templateUrl: './historical-places.page.html',
  styleUrls: ['./historical-places.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})

export class HistoricalPlacesPage implements OnInit {
  places: any[] = [];
  loading = true;

  constructor(
    private navCtrl: NavController,
    private placesService: PlacesService
  ) {}

  ngOnInit() {
    this.loadPlaces();
  }

  loadPlaces() {
    // Delay Firebase calls to ensure they run within proper injection context
    setTimeout(() => {
      this.placesService.getPlaces().subscribe({
        next: (data) => {
          this.places = data;
          this.loading = false;
          console.log('Places loaded:', this.places);
        },
        error: (err) => {
          console.error('Error loading places:', err);
          this.loading = false;
        }
      });
    }, 0);
  }

  goBack() {
    this.navCtrl.back();
  }

  openPlace(placeId: string) {
    this.navCtrl.navigateForward(`/places/${placeId}`);
  }
}
