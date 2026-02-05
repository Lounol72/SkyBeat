import { Routes } from '@angular/router';
import { LandingComponent } from './components/landing/landing.component';
import { GenerateComponent } from './components/generate/generate.component';
import { Meteo } from './component/meteo/meteo'
import { LoginComponent } from './components/login/login.component';
import { SignupComponent } from './components/signup/signup.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'generate', component: GenerateComponent },

    { path: '', component: Meteo }
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'settings', component: SettingsComponent },
];
