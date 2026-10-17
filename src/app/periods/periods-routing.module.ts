import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PeriodsPage } from './periods.page';

const routes: Routes = [
  {
    path: '',
    component: PeriodsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PeriodsPageRoutingModule {}
