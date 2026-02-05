import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  musicPreference: 'youtube' | 'spotify' = 'youtube';
  autoPlay = true;
  notifications = true;
  theme: 'light' | 'dark' = 'light';

  onSaveSettings() {
    // Logique pour sauvegarder les paramètres
    console.log('Settings saved:', {
      musicPreference: this.musicPreference,
      autoPlay: this.autoPlay,
      notifications: this.notifications,
      theme: this.theme
    });
    
    // Sauvegarder dans localStorage
    localStorage.setItem('musicPreference', this.musicPreference);
    localStorage.setItem('autoPlay', String(this.autoPlay));
    localStorage.setItem('notifications', String(this.notifications));
    localStorage.setItem('theme', this.theme);
    
    // Appliquer le thème
    this.applyTheme(this.theme);
    
    alert('Paramètres sauvegardés avec succès !');
  }

  applyTheme(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  ngOnInit() {
    // Charger les paramètres depuis localStorage
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
