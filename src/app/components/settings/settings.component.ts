import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings';

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

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private settingsService: SettingsService) {}

  onSaveSettings() {
    console.log('Settings saved:', {
      musicPreference: this.musicPreference,
      autoPlay: this.autoPlay,
      notifications: this.notifications,
      theme: this.theme
    });

    const parameters = {
      musicPreference: this.musicPreference,
      autoPlay: this.autoPlay,
      notifications: this.notifications,
      theme: this.theme
    }
    
    this.settingsService.setSettings(parameters);
    alert('Paramètres sauvegardés avec succès !');
  }

  ngOnInit() {
    if(this.settingsService.loadFromLocalStorage()){
      const parameters = this.settingsService.getSettings();
      const savedMusicPref = parameters.musicPreference;
      if (savedMusicPref === 'youtube' || savedMusicPref === 'spotify') {
        this.musicPreference = savedMusicPref;
      }
      
      const savedAutoPlay = parameters.autoPlay;
      if (savedAutoPlay !== null) {
        this.autoPlay = savedAutoPlay;
      }
      
      const savedNotifications = parameters.notifications;
      if (savedNotifications !== null) {
        this.notifications = savedNotifications;
      }
      
      const savedTheme = parameters.theme;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        this.theme = savedTheme;
      }
    }

  }
}
