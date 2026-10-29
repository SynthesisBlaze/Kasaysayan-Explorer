import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonicModule, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { register } from 'swiper/element/bundle';
import { PeriodsService } from '../../services/periods.service';

register();

@Component({
  selector: 'app-historical-periods',
  templateUrl: './historical-periods.page.html',
  styleUrls: ['./historical-periods.page.scss'],
  imports: [IonicModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HistoricalPeriodsPage implements OnInit, OnDestroy {
  @ViewChild('carousel') carousel?: ElementRef<any>;

  periods: any[] = [];
  loading = true;
  loadError = false;
  activeIndex = 0;
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

  loadPeriods() {
    this.loading = true;
    this.loadError = false;
    this.sub?.unsubscribe();
    setTimeout(() => {
      this.sub = this.periodsService.getPeriods().subscribe({
        next: (data) => {
          this.periods = [...data].sort((a, b) => this.startYear(a.date) - this.startYear(b.date));
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

  startYear(date: string | undefined): number {
    const match = (date || '').match(/\d{4}/);
    if (!match) return Infinity;
    const year = Number(match[0]);
    return /^\s*before/i.test(date || '') ? year - 1000 : year;
  }

  shortYear(date: string | undefined): string {
    const match = (date || '').match(/\d{4}/);
    if (!match) return '?';
    return /^\s*before/i.test(date || '') ? 'Early' : match[0];
  }

  onSlideChange() {
    this.activeIndex = this.carousel?.nativeElement.swiper?.activeIndex ?? 0;
  }

  goTo(index: number) {
    this.carousel?.nativeElement.swiper?.slideTo(index);
    this.activeIndex = index;
  }

  goBack() {
    this.navCtrl.back();
  }

  openPeriod(periodId: string) {
    this.navCtrl.navigateForward(`/periods/${periodId}`);
  }
}
