import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { GoogleMapsModule } from '@angular/google-maps';
import { FormsModule } from '@angular/forms';

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(GoogleMapsModule, FormsModule)],
}).catch((err) => console.error(err));
