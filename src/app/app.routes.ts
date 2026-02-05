import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { GenerateComponent } from './components/generate/generate.component';
import { Meteo } from './component/meteo/meteo'

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'generate', component: GenerateComponent },

    { path: '', component: Meteo }
];
