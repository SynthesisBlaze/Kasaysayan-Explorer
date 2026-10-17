import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export type ThemeMode = 'light' | 'dark' | 'default';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'app-theme';
  private readonly COLORBLIND_KEY = 'color-blind-mode';
  private currentTheme: ThemeMode = 'default';
  private colorBlindModeEnabled: boolean = false;

  constructor() {
    this.initializeTheme();
  }

  async initializeTheme() {
    const { value: themeValue } = await Preferences.get({ key: this.THEME_KEY });
    const { value: colorBlindValue } = await Preferences.get({ key: this.COLORBLIND_KEY });
    
    this.currentTheme = (themeValue as ThemeMode) || 'default';
    this.colorBlindModeEnabled = colorBlindValue === 'true';
    
    if (this.colorBlindModeEnabled) {
      this.applyColorBlindTheme();
    } else {
      this.applyTheme(this.currentTheme);
    }
  }

  async setTheme(theme: ThemeMode) {
    this.currentTheme = theme;
    await Preferences.set({
      key: this.THEME_KEY,
      value: theme
    });
    
    if (!this.colorBlindModeEnabled) {
      this.applyTheme(theme);
    }
  }

  getTheme(): ThemeMode {
    return this.currentTheme;
  }

  async setColorBlindMode(enabled: boolean) {
    this.colorBlindModeEnabled = enabled;
    await Preferences.set({
      key: this.COLORBLIND_KEY,
      value: enabled.toString()
    });
    
    if (enabled) {
      this.applyColorBlindTheme();
    } else {
      this.applyTheme(this.currentTheme);
    }
  }

  async getColorBlindMode(): Promise<boolean> {
    return this.colorBlindModeEnabled;
  }

  private applyColorBlindTheme() {
    // Remove all theme classes
    document.body.classList.remove('light-theme', 'dark-theme');
    // Add color blind mode class
    document.body.classList.add('color-blind-theme');
  }

  private applyTheme(theme: ThemeMode) {
    // Remove all theme classes first
    document.body.classList.remove('light-theme', 'dark-theme', 'color-blind-theme');
    
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    }
    // For 'default', we don't add any class, which applies your custom palette
  }
}