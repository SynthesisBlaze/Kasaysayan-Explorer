import { Component, OnInit, OnDestroy, CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { Subscription } from 'rxjs';
import { PeriodsService } from '../services/periods.service';
import { EventsService } from '../services/events.service';
import { FiguresService } from '../services/figures.service';
import { PlacesService } from '../services/places.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonicSlides } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';
import { Router, RouterLink } from '@angular/router';

register();

@Component({
  selector: 'app-discover',
  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, AppBarComponent, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DiscoverPage implements OnInit, OnDestroy {
  swiperModules = [IonicSlides];
  currentPeriodIndex = 0;
  private isNavigating = false;
  private subscriptions: Subscription[] = [];

  quickLinks = [
    { label: 'Periods', icon: 'time', route: '/historical-periods' },
    { label: 'Events', icon: 'calendar', route: '/historical-events' },
    { label: 'Figures', icon: 'person', route: '/historical-figures' },
    { label: 'Places', icon: 'location', route: '/historical-places' },
  ];

  historicalPeriods = [
    {
      id: 'precolonialism',
      title: 'Pre-colonialism',
      subtitle: 'Before 1521',
      image: 'assets/images/precolonialism.jpg'
    },
    {
      id: 'spanishcolonial',
      title: 'Spanish Era',
      subtitle: '1521-1898',
      image: 'assets/images/spanishcolonialism.jpg'
    },
    {
      id: 'americanoccupation',
      title: 'American Period',
      subtitle: '1898-1942',
      image: 'assets/images/americancolonialism.jpg'
    },
    {
      id: 'japanesecolonial',
      title: 'Japanese Occupation',
      subtitle: '1942-1945',
      image: 'assets/images/japaneseoccupation.jpg'
    },
    {
      id: 'postindependence',
      title: 'Post Independence',
      subtitle: '1946 - present',
      image: 'assets/images/postindependence.jpg'
    }
  ];

  historicalEvents = [
    {
      id: 'battleofmactan',
      title: 'Battle of Mactan',
      year: '1521',
      image: 'assets/images/battleofmactan.jpg'
    },
    {
      id: 'executionofrizal',
      title: 'Execution of Rizal',
      year: '1896',
      image: 'assets/images/executionofrizal.jpg'
    },
    {
      id: 'cryofbalintawak',
      title: 'Cry of Balintawak',
      year: '1896',
      image: 'assets/images/cryofbalintawak.png'
    },
    {
      id: 'peoplepower',
      title: 'People Power Revolution',
      year: '1986',
      image: 'assets/images/peoplepower.jpg'
    }
  ];

  historicalFigures = [
    {
      id: 'andresbonifacio',
      name: 'Andres Bonifacio',
      years: '1863 - 1897',
      image: 'assets/images/andresbonifacio.jpg'
    },
    {
      id: 'joserizal',
      name: 'Dr. Jose Rizal',
      years: '1861 - 1896',
      image: 'assets/images/joserizal.jpg'
    }
  ];

  historicalPlaces = [
    {
      id: 'intramuros',
      name: 'Intramuros',
      image: 'assets/images/intramuros.webp'
    },
    {
      id: 'rizalpark',
      name: 'Rizal Park',
      image: 'assets/images/rizalpark.jpg'
    },
    {
      id: 'mactanshrine',
      name: 'Mactan Shrine',
      image: 'assets/images/mactanshrine.jpg'
    }
  ];

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private periodsService: PeriodsService,
    private eventsService: EventsService,
    private figuresService: FiguresService,
    private placesService: PlacesService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this.periodsService.getPeriods().subscribe({
        next: (items) => {
          if (!items.length) return;
          this.historicalPeriods = this.byYear(items, (p) => p.date).map((p) => ({
            id: p.id,
            title: (p.name || '').trim(),
            subtitle: p.date || '',
            image: p.imgPath
          }));
        },
        error: (err) => console.error('Error loading periods:', err)
      }),
      this.eventsService.getEvents().subscribe({
        next: (items) => {
          if (!items.length) return;
          this.historicalEvents = this.byYear(items, (e) => e.date).map((e) => ({
            id: e.id,
            title: (e.name || '').trim(),
            year: this.yearOf(e.date)?.toString() || '',
            image: e.imgPath
          }));
        },
        error: (err) => console.error('Error loading events:', err)
      }),
      this.figuresService.getFigures().subscribe({
        next: (items) => {
          if (!items.length) return;
          this.historicalFigures = this.byYear(items, (f) => f.birth).map((f) => ({
            id: f.id,
            name: (f.name || '').trim(),
            years: this.lifespan(f.birth, f.death),
            image: f.imgPath
          }));
        },
        error: (err) => console.error('Error loading figures:', err)
      }),
      this.placesService.getPlaces().subscribe({
        next: (items) => {
          if (!items.length) return;
          this.historicalPlaces = [...items]
            .sort((a, b) => (a.name || '').trim().localeCompare((b.name || '').trim()))
            .map((p) => ({ id: p.id, name: (p.name || '').trim(), image: p.imgPath }));
        },
        error: (err) => console.error('Error loading places:', err)
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private yearOf(text: string | undefined): number | null {
    const match = (text || '').match(/\d{4}/);
    if (!match) return null;
    const year = Number(match[0]);
    return /^\s*before/i.test(text || '') ? year - 1000 : year;
  }

  private byYear<T>(items: T[], dateOf: (item: T) => string | undefined): T[] {
    return [...items].sort((a, b) =>
      (this.yearOf(dateOf(a)) ?? Infinity) - (this.yearOf(dateOf(b)) ?? Infinity));
  }

  private lifespan(birth: string | undefined, death: string | undefined): string {
    const born = this.yearOf(birth);
    const died = this.yearOf(death);
    if (born && died) return `${born} - ${died}`;
    if (born) return /around|circa|c\./i.test(birth || '') ? `c. ${born}` : `Born ${born}`;
    return died ? `Died ${died}` : '';
  }

  private handleNavigation(route: string[], event: Event) {
    if (this.isNavigating) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    
    this.isNavigating = true;
    
    if (event) {
      event.stopPropagation();
    }
    
    const timeoutId = setTimeout(() => {
      this.isNavigating = false;
    }, 2000);
    
    this.ngZone.run(() => {
      this.router.navigate(route).then(() => {
        clearTimeout(timeoutId);
        this.isNavigating = false;
      }).catch(() => {
        clearTimeout(timeoutId);
        this.isNavigating = false;
      });
    });
  }

  navigateToPeriod(id: string, event: Event) {
    this.handleNavigation(['/periods', id], event);
  }

  navigateToEvent(id: string, event: Event) {
    this.handleNavigation(['/events', id], event);
  }

  navigateToFigure(id: string, event: Event) {
    this.handleNavigation(['/figures', id], event);
  }

  navigateToPlace(id: string, event: Event) {
    this.handleNavigation(['/places', id], event);
  }

}