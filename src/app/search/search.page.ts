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
  loading = true;
  private loadedCategories = new Set<string>();
  private subscriptions: Subscription[] = [];

  readonly categories = [
    { label: 'Places', route: '/historical-places', image: 'assets/images/Places.jpg', icon: 'location-outline' },
    { label: 'Figures', route: '/historical-figures', image: 'assets/images/Figures.jpg', icon: 'person-outline' },
    { label: 'Events', route: '/historical-events', image: 'assets/images/Events.jpg', icon: 'calendar-outline' },
    { label: 'Periods', route: '/historical-periods', image: 'assets/images/Government.jpg', icon: 'time-outline' },
  ];

  private readonly categoryIcons: Record<string, string> = {
    figure: 'person-outline',
    place: 'location-outline',
    event: 'calendar-outline',
    period: 'time-outline',
  };

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
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAllData() {
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

        this.allData = [
          ...this.allData.filter((d) => d.category !== category),
          ...formatted
        ];

        this.loadedCategories.add(category);
        this.loading = this.loadedCategories.size < services.length;
        this.applyFilter();
      }, () => {
        this.loadedCategories.add(category);
        this.loading = this.loadedCategories.size < services.length;
      });

      this.subscriptions.push(sub);
    });
  }

  onSearch(event: any) {
    this.searchTerm = (event.detail.value || '').trim();
    this.applyFilter();
  }

  clearSearch() {
    this.searchTerm = '';
    this.filteredResults = [];
  }

  categoryIcon(category: string): string {
    return this.categoryIcons[category] || 'document-outline';
  }

  private applyFilter() {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredResults = [];
      return;
    }

    this.filteredResults = this.allData
      .filter((item) => (item.name || '').toLowerCase().includes(term))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(term) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(term) ? 0 : 1;
        return aStarts - bStarts || a.name.localeCompare(b.name);
      });
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
