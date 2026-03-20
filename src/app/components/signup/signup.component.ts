import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  isRegistered = false;

  constructor(private http: HttpClient) {}

  onSignup() {
    if (this.password !== this.confirmPassword) {
      alert('Les mots de passe ne correspondent pas !');
      return;
    }
    
    // Logique d'inscription à implémenter
    console.log('Signup:', this.email);

    const payload = {
      username: this.username,
      email: this.email.toUpperCase(),
      password: this.password
    };

    this.http.post("http://localhost:3080/accounts/signup", payload)
      .subscribe({
        next: (res: any) => {

          console.log("Signup success:", res);

          this.isRegistered = true;
        },

        error: (err) => {

          console.error("Signup error:", err);
          if(err.status === 400) alert("Un compte avec l'email : " + this.email + " existe déjà !");
          else alert("Erreur lors de l'inscription");

        }
      });
  }
}
