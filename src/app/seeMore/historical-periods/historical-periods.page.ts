import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { PeriodsService } from '../../services/periods.service';

@Component({
  selector: 'app-historical-periods',
  templateUrl: './historical-periods.page.html',
  styleUrls: ['./historical-periods.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HistoricalPeriodsPage implements OnInit, OnDestroy {
  periods: any[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  private sub?: Subscription;

  constructor(
    private navCtrl: NavController,
    private periodsService: PeriodsService
  ) {}

  ngOnInit() {
    this.loadPeriods();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get filteredPeriods(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.periods
      .filter((item) => !term || (item.name || '').toLowerCase().includes(term))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  loadPeriods() {
    this.loading = true;
    this.loadError = false;
    this.sub?.unsubscribe();
    setTimeout(() => {
      this.sub = this.periodsService.getPeriods().subscribe({
        next: (data) => {
          this.periods = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading periods:', err);
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

  openPeriod(periodId: string) {
    this.navCtrl.navigateForward(`/periods/${periodId}`);
  }
}
