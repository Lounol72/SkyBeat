import { Component, OnInit, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  email = '';
  password = '';
  isLoggedIn = false;
  spotifyUser: any = null;
  loginError = '';

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // Vérifier si l'utilisateur revient après l'OAuth Spotify
    this.route.queryParams.subscribe(params => {
      if (params['spotify_token']) {
        const tokenId = params['spotify_token'];
        localStorage.setItem('spotify_token_id', tokenId);
        
        // Récupérer les infos utilisateur
        this.http.get(`${environment.backendUrl}/spotify/me?token_id=${tokenId}`)
          .subscribe({
            next: (user) => {
              this.spotifyUser = user;
              this.isLoggedIn = true;
              localStorage.setItem('spotifyUser', JSON.stringify(user));
              // Nettoyer l'URL
              this.router.navigate(['/login'], { queryParams: {} });
            },
            error: (err) => {
              console.error('Error fetching Spotify user:', err);
              this.loginError = 'Erreur lors de la récupération des infos Spotify';
            }
          });
      } else if (params['error']) {
        this.loginError = 'Erreur de connexion Spotify: ' + params['error'];
      }
    });

    // Vérifier si déjà connecté
    const savedUser = localStorage.getItem('spotifyUser');
    if (savedUser) {
      this.spotifyUser = JSON.parse(savedUser);
      this.isLoggedIn = true;
    }
  }

  onLogin() {
    // Logique de connexion à implémenter
    console.log('Login:', this.email);
    // Simulation de connexion
    this.isLoggedIn = true;
  }

  onSpotifyLogin() {
    if (isPlatformBrowser(this.platformId)) {
      window.location.href = `${environment.backendUrl}/spotify/login`;
    }
  }

  onLogout() {
    this.isLoggedIn = false;
    this.email = '';
    this.password = '';
    this.spotifyUser = null;
    
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('spotify_token_id');
      localStorage.removeItem('spotifyUser');
    }
  }
}
