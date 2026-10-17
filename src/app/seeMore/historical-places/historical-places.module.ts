import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HistoricalPlacesPageRoutingModule } from './historical-places-routing.module';

import { HistoricalPlacesPage } from './historical-places.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HistoricalPlacesPageRoutingModule
  ],
  declarations: [HistoricalPlacesPage]
})
export class HistoricalPlacesPageModule {}
