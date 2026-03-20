import { Injectable } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  musicPreference: 'youtube' | 'spotify' = 'youtube';
  autoPlay: boolean = true;
  notifications: boolean = true;
  theme: 'light' | 'dark' = 'light';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  getSettings(){
    return {
      musicPreference: this.musicPreference,
      autoPlay: this.autoPlay,
      notifications: this.notifications,
      theme: this.theme
    }
  }

  setSettings(parameters: any) {
    if (isPlatformBrowser(this.platformId)) {
      if (parameters.musicPreference !== undefined) {
        this.musicPreference = parameters.musicPreference;
        localStorage.setItem("musicPreference", parameters.musicPreference);
      }

      if (parameters.autoPlay !== undefined) {
        this.autoPlay = parameters.autoPlay;
        localStorage.setItem("autoPlay", parameters.autoPlay);
      }

      if (parameters.notifications !== undefined) {
        this.notifications = parameters.notifications;
        localStorage.setItem("notifications", parameters.notifications);
      }

      if (parameters.theme !== undefined) {
        this.theme = parameters.theme;
        localStorage.setItem("theme", parameters.theme);
      }
    }
    this.applyTheme(this.theme);
  }


  loadFromLocalStorage() {
    if (!isPlatformBrowser(this.platformId)) {
      return false;
    }

    let hasLoaded = false;

    const savedMusicPref = localStorage.getItem('musicPreference');
    if (savedMusicPref === 'youtube' || savedMusicPref === 'spotify') {
      this.musicPreference = savedMusicPref;
      hasLoaded = true;
    }
    
    const savedAutoPlay = localStorage.getItem('autoPlay');
    if (savedAutoPlay !== null) {
      this.autoPlay = savedAutoPlay === 'true';
      hasLoaded = true;
    }
    
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications !== null) {
      this.notifications = savedNotifications === 'true';
      hasLoaded = true;
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.theme = savedTheme;
      this.applyTheme(this.theme);
      hasLoaded = true;
    }
    return hasLoaded;
  }

  applyTheme(theme: 'light' | 'dark') {
    if (isPlatformBrowser(this.platformId)) {
      if (theme === 'dark') {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    }
  }

}