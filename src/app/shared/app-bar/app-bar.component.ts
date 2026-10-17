import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-app-bar',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './app-bar.component.html',
  styleUrls: ['./app-bar.component.scss']
})
export class AppBarComponent {
  @Input() title: string = 'Default Title';
  @Input() showBackButton: boolean = false;
}
