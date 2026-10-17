import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistoricalEventsPage } from './historical-events.page';

const routes: Routes = [
  {
    path: '',
    component: HistoricalEventsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistoricalEventsPageRoutingModule {}
