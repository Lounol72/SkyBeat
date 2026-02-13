import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-meteo',
  standalone: true,
  templateUrl: './meteo.component.html',
  imports: [CommonModule],
  styleUrl: './meteo.component.css'
})
export class MeteoComponent implements OnInit {

  temperature?: number;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // DECOMMENTEZ POUR UTILISER L'API METEO

    /*if (isPlatformBrowser(this.platformId)) {
      this.getTemperature();
    }*/
  }

  getTemperature(): void {
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      '?latitude=48' +
      '&longitude=0.2' +
      '&current=temperature_2m' +
      '&timezone=auto';

    this.http.get<any>(url).subscribe(response => {
      this.temperature = response.current.temperature_2m;
      console.log("température reçu : " + response.current.temperature_2m);
      this.cdr.detectChanges();
    });
  }
}