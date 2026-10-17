import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistoricalPeriodsPageRoutingModule } from './historical-periods-routing.module';

import { HistoricalPeriodsPage } from './historical-periods.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistoricalPeriodsPageRoutingModule
  ],
  declarations: [HistoricalPeriodsPage]
})
export class HistoricalPeriodsPageModule {}
