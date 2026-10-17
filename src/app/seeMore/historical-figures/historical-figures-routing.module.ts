import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HistoricalFiguresPage } from './historical-figures.page';

const routes: Routes = [
  {
    path: '',
    component: HistoricalFiguresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HistoricalFiguresPageRoutingModule {}
