import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { FiguresPage } from './figures.page';

@NgModule({
  // declarations: [ContentPage],
  imports: [
    CommonModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: FiguresPage, }]),
  ]
})
export class FiguresPageModule {}