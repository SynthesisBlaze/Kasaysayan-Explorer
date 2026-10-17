import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistoricalEventsPageRoutingModule } from './historical-events-routing.module';

import { HistoricalEventsPage } from './historical-events.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistoricalEventsPageRoutingModule
  ],
  declarations: [HistoricalEventsPage]
})
export class HistoricalEventsPageModule {}
