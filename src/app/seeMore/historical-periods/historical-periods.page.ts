import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { PeriodsService } from '../../services/periods.service';


@Component({
  selector: 'app-historical-periods',
  templateUrl: './historical-periods.page.html',
  styleUrls: ['./historical-periods.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})

export class HistoricalPeriodsPage implements OnInit {
  periods: any[] = [];
  loading = true;

  constructor(
    private navCtrl: NavController,
    private periodsService: PeriodsService
  ) {}

  ngOnInit() {
    this.loadPeriods();
  }

  loadPeriods() {
    // Delay Firebase calls to ensure they run within proper injection context
    setTimeout(() => {
      this.periodsService.getPeriods().subscribe({
        next: (data) => {
          this.periods = data;
          this.loading = false;
          console.log('Periods loaded:', this.periods);
        },
        error: (err) => {
          console.error('Error loading periods:', err);
          this.loading = false;
        }
      });
    }, 0);
  }

  goBack() {
    this.navCtrl.back();
  }

  openPeriod(periodId: string) {
    this.navCtrl.navigateForward(`/periods/${periodId}`);
  }
}
