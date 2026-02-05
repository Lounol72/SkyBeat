import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { GenerateComponent } from './components/generate/generate.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'generate', component: GenerateComponent },
];
