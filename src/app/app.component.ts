// import '@googlemaps/extended-component-library';
import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule, MapInfoWindow, MapMarker } from '@angular/google-maps';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppComponent implements AfterViewInit {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow;
  @ViewChild('autocomplete', { static: false }) autocompleteEl!: ElementRef;
  @ViewChild('mapMarker') mapMarker!: MapMarker;
  @ViewChild('searchInput') searchInput!: ElementRef;
  @ViewChild('auto') auto!: ElementRef;

  zoom = 12;
  center: google.maps.LatLngLiteral = { lat: -26.2041, lng: 28.0473 }; // Default to Johannesburg
  markerPosition?: google.maps.LatLngLiteral;
  infoContent = '';
  markerOptions: google.maps.MarkerOptions = { draggable: false };
  darkMode = false;

  //

  //

  ngAfterViewInit() {
    // Initialize geocoder once maps API is ready
    if (!google || !google.maps) {
      console.error('Google Maps API not loaded');
      return;
    }
  }

  searchPlace() {
    const query = this.searchInput.nativeElement.value;
    if (!query) return;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address: query }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        this.center = {
          lat: location.lat(),
          lng: location.lng(),
        };
        this.markerPosition = this.center;
        this.zoom = 15;
        this.infoContent = `
          <strong>${results[0].formatted_address}</strong>
        `;
      } else {
        alert('Location not found: ' + status);
      }
    });
  }

  // Move the logic into a separate method for clarity
  private handlePlaceChange(event: any) {
    const place = event.target.value;
    if (!place || !place.location) {
      console.warn('No valid place found');
      return;
    }

    const loc = place.location;
    this.center = { lat: loc.lat(), lng: loc.lng() };
    this.markerPosition = this.center;
    this.zoom = 15;

    this.infoContent = `
      <strong>${place.displayName || 'Unknown Place'}</strong><br>
      ${place.formattedAddress || ''}
    `;
  }

  onManualSearch() {
    const input = (document.getElementById('autocomplete') as HTMLInputElement).value;
    if (!input) return;

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: input }, (results, status) => {
      if (status === 'OK' && results && results[0].geometry?.location) {
        const loc = results[0].geometry.location;
        this.center = { lat: loc.lat(), lng: loc.lng() };
        this.markerPosition = this.center;
        this.zoom = 15;
        this.infoContent = `<strong>${results[0].formatted_address}</strong>`;
      } else {
        alert('Address not found!');
      }
    });
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      this.markerPosition = event.latLng.toJSON();
      this.infoContent = `Clicked at: ${event.latLng.lat()}, ${event.latLng.lng()}`;
    }
  }

  openInfoWindow() {
    if (this.mapMarker) {
      this.infoWindow.open(this.mapMarker);
    }
  }

  toggleTheme() {
    this.darkMode = !this.darkMode;
  }
}
