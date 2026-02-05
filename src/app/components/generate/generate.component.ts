import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-generate',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="generate-placeholder">
      <h2>Generate your music</h2>
      <p>Cette page sera bientôt disponible.</p>
      <a routerLink="/">Retour à l'accueil</a>
    </div>
  `,
  styles: [
    `
      .generate-placeholder {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
      }
      .generate-placeholder a {
        margin-top: 1rem;
        color: rgba(255, 255, 255, 0.9);
      }
    `,
  ],
})
export class GenerateComponent {}
