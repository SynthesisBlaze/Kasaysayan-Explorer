import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';
import { PlacesService } from '../services/places.service';
import { FiguresService } from '../services/figures.service';
import { EventsService } from '../services/events.service';
import { PeriodsService } from '../services/periods.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [IonicModule, CommonModule, AppBarComponent, RouterLink],
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit, OnDestroy {
  allData: any[] = [];
  filteredResults: any[] = [];
  searchTerm: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private figuresService: FiguresService,
    private placesService: PlacesService,
    private eventsService: EventsService,
    private periodsService: PeriodsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadAllData();
  }

  ngOnDestroy() {
    // Clean up subscriptions to prevent duplication
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAllData() {
    // Clear existing data before reloading (avoids duplicates)
    this.allData = [];

    const services = [
      { service: this.figuresService.getFigures(), category: 'figure' },
      { service: this.placesService.getPlaces(), category: 'place' },
      { service: this.eventsService.getEvents(), category: 'event' },
      { service: this.periodsService.getPeriods(), category: 'period' }
    ];

    services.forEach(({ service, category }) => {
      const sub = service.subscribe((data) => {
        const formatted = data.map((item: any) => ({
          ...item,
          category,
        }));

        // ✅ Merge cleanly, avoid duplicating existing entries
        this.allData = [
          ...this.allData.filter((d) => d.category !== category),
          ...formatted
        ];
      });

      this.subscriptions.push(sub);
    });
  }

  onSearch(event: any) {
    const term = event.detail.value.toLowerCase();
    this.searchTerm = term;

    if (!term) {
      this.filteredResults = [];
      return;
    }

    this.filteredResults = this.allData.filter((item) =>
      item.name.toLowerCase().includes(term)
    );
  }

  openDetail(item: any) {
    switch (item.category) {
      case 'figure':
        this.router.navigate(['/figures', item.id]);
        break;
      case 'place':
        this.router.navigate(['/places', item.id]);
        break;
      case 'event':
        this.router.navigate(['/events', item.id]);
        break;
      case 'period':
        this.router.navigate(['/periods', item.id]);
        break;
    }
  }
}
