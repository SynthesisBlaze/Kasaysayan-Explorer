import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { EventsService } from '../../services/events.service';

@Component({
  selector: 'app-historical-events',
  templateUrl: './historical-events.page.html',
  styleUrls: ['./historical-events.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HistoricalEventsPage implements OnInit, OnDestroy {
  events: any[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  private sub?: Subscription;

  constructor(
    private navCtrl: NavController,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get filteredEvents(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.events
      .filter((item) => !term || (item.name || '').toLowerCase().includes(term))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  loadEvents() {
    this.loading = true;
    this.loadError = false;
    this.sub?.unsubscribe();
    setTimeout(() => {
      this.sub = this.eventsService.getEvents().subscribe({
        next: (data) => {
          this.events = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading events:', err);
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

  openEvent(eventId: string) {
    this.navCtrl.navigateForward(`/events/${eventId}`);
  }
}
