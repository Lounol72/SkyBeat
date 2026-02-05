import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  isLoggedIn = false;

  onLogin() {
    // Logique de connexion à implémenter
    console.log('Login:', this.email);
    // Simulation de connexion
    this.isLoggedIn = true;
  }

  onLogout() {
    this.isLoggedIn = false;
    this.email = '';
    this.password = '';
  }
}
