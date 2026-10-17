import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistoricalPeriodsPage } from './historical-periods.page';

const routes: Routes = [
  {
    path: '',
    component: HistoricalPeriodsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistoricalPeriodsPageRoutingModule {}
