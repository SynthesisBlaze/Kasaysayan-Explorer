import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistoricalPlacesPage } from './historical-places.page';

const routes: Routes = [
  {
    path: '',
    component: HistoricalPlacesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistoricalPlacesPageRoutingModule {}
