import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule, NavController } from '@ionic/angular';
import { FiguresService } from '../../services/figures.service';


@Component({
  selector: 'app-historical-figures',
  templateUrl: './historical-figures.page.html',
  styleUrls: ['./historical-figures.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})

export class HistoricalFiguresPage implements OnInit {
  figures: any[] = [];
  loading = true;

  constructor(
    private navCtrl: NavController,
    private figuresService: FiguresService
  ) {}

  ngOnInit() {
    this.loadFigures();
  }

  loadFigures() {
    // Delay Firebase calls to ensure they run within proper injection context
    setTimeout(() => {
      this.figuresService.getFigures().subscribe({
        next: (data) => {
          this.figures = data;
          this.loading = false;
          console.log('Figures loaded:', this.figures);
        },
        error: (err) => {
          console.error('Error loading figures:', err);
          this.loading = false;
        }
      });
    }, 0);
  }

  goBack() {
    this.navCtrl.back();
  }

  openFigure(figureId: string) {
    this.navCtrl.navigateForward(`/figures/${figureId}`);
  }
}
