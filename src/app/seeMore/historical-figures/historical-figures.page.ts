import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { FiguresService } from '../../services/figures.service';

@Component({
  selector: 'app-historical-figures',
  templateUrl: './historical-figures.page.html',
  styleUrls: ['./historical-figures.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class HistoricalFiguresPage implements OnInit, OnDestroy {
  figures: any[] = [];
  loading = true;
  loadError = false;
  searchTerm = '';
  readonly skeletons = [1, 2, 3, 4, 5, 6];
  private sub?: Subscription;

  constructor(
    private navCtrl: NavController,
    private figuresService: FiguresService
  ) {}

  ngOnInit() {
    this.loadFigures();
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get filteredFigures(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.figures
      .filter((item) => !term || (item.name || '').toLowerCase().includes(term))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  loadFigures() {
    this.loading = true;
    this.loadError = false;
    this.sub?.unsubscribe();
    setTimeout(() => {
      this.sub = this.figuresService.getFigures().subscribe({
        next: (data) => {
          this.figures = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading figures:', err);
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

  openFigure(figureId: string) {
    this.navCtrl.navigateForward(`/figures/${figureId}`);
  }
}
