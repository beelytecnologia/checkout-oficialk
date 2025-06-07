import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { routes } from './app.routes';
import Aura from '@primeng/themes/aura'; // ou outro tema

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),           // <-- as rotas do seu app
    provideAnimationsAsync(),        // <-- animações necessárias para PrimeNG
    providePrimeNG({
      theme: {
        preset: Aura                 // <-- ativa o tema visual do PrimeNG
      }
    })
  ]
};
