import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import  { EventsService } from '../../services/events.service';


@Component({
  selector: 'app-historical-events',
  templateUrl: './historical-events.page.html',
  styleUrls: ['./historical-events.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule,],
})

export class HistoricalEventsPage implements OnInit {
  events: any[] = [];
  loading = true;

  constructor(
    private navCtrl: NavController,
    private eventsService: EventsService
  ) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    // Delay Firebase calls to ensure they run within proper injection context
    setTimeout(() => {
      this.eventsService.getEvents().subscribe({
        next: (data) => {
          this.events = data;
          this.loading = false;
          console.log('Events loaded:', this.events);
        },
        error: (err) => {
          console.error('Error loading events:', err);
          this.loading = false;
        }
      });
    }, 0);
  }

  goBack() {
    this.navCtrl.back();
  }

  openEvent(eventId: string) {
    this.navCtrl.navigateForward(`/events/${eventId}`);
  }
}
