import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { PeriodsPage } from './periods.page';

@NgModule({
  // declarations: [ContentPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: PeriodsPage, }]),
  ]
})
export class PeriodsPageModule {}