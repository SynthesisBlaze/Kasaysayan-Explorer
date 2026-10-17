import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonList, IonItem, IonLabel, IonSelect, IonSelectOption, IonToggle } from '@ionic/angular/standalone';
import { ThemeService, ThemeMode } from '../services/theme';
import { AppBarComponent } from '../shared/app-bar/app-bar.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
    AppBarComponent
  ]
})
export class SettingsPage implements OnInit {
  selectedTheme: ThemeMode = 'default';
  colorBlindMode: boolean = false;

  constructor(private themeService: ThemeService) {}

  async ngOnInit() {
    this.selectedTheme = this.themeService.getTheme();
    this.colorBlindMode = await this.themeService.getColorBlindMode();
    console.log('Current theme on load:', this.selectedTheme);
    console.log('Color blind mode on load:', this.colorBlindMode);
  }

  onThemeChange(event: any) {
    const theme = event.detail.value as ThemeMode;
    console.log('Theme changing to:', theme);
    this.themeService.setTheme(theme);
    console.log('Body classes after change:', document.body.className);
  }

  async onColorBlindModeChange(event: any) {
    const enabled = event.detail.checked;
    console.log('Color blind mode:', enabled);
    this.colorBlindMode = enabled;
    await this.themeService.setColorBlindMode(enabled);
  }
}