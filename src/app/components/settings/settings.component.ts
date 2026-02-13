import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  musicPreference: 'youtube' | 'spotify' = 'youtube';
  autoPlay = true;
  notifications = true;
  theme: 'light' | 'dark' = 'light';

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  onSaveSettings() {
    console.log('Settings saved:', {
      musicPreference: this.musicPreference,
      autoPlay: this.autoPlay,
      notifications: this.notifications,
      theme: this.theme
    });
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('musicPreference', this.musicPreference);
      localStorage.setItem('autoPlay', String(this.autoPlay));
      localStorage.setItem('notifications', String(this.notifications));
      localStorage.setItem('theme', this.theme);
      this.applyTheme(this.theme);
      alert('Paramètres sauvegardés avec succès !');
    }
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

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedMusicPref = localStorage.getItem('musicPreference');
    if (savedMusicPref === 'youtube' || savedMusicPref === 'spotify') {
      this.musicPreference = savedMusicPref;
    }
    
    const savedAutoPlay = localStorage.getItem('autoPlay');
    if (savedAutoPlay !== null) {
      this.autoPlay = savedAutoPlay === 'true';
    }
    
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications !== null) {
      this.notifications = savedNotifications === 'true';
    }
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.theme = savedTheme;
      this.applyTheme(this.theme);
    }
  }
}
