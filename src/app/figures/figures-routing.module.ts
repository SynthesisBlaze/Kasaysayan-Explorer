import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FiguresPage } from './figures.page';

const routes: Routes = [
  {
    path: '',
    component: FiguresPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FiguresPageRoutingModule {}
