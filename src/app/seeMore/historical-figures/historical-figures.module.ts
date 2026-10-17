import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistoricalFiguresPageRoutingModule } from './historical-figures-routing.module';

import { HistoricalFiguresPage } from './historical-figures.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistoricalFiguresPageRoutingModule
  ],
  declarations: [HistoricalFiguresPage]
})
export class HistoricalFiguresPageModule {}
