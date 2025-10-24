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

  ngAfterViewInit() {
    // Check if autocomplete element is ready
    if (!google || !google.maps) {
      console.error('Autocomplete element not found');
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(this.searchInput.nativeElement, {
      fields: ['formatted_address', 'geometry', 'name'],
      types: ['geocode'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        alert('No details available for this location.');
        return;
      }

      const loc = place.geometry.location;
      this.center = { lat: loc.lat(), lng: loc.lng() };
      this.markerPosition = this.center;
      this.zoom = 15;
      this.infoContent = `
        <strong>${place.name || 'Unknown Place'}</strong><br>
        ${place.formatted_address || ''}
      `;
    });
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

  //   onMapClick(event: google.maps.MapMouseEvent) {
  //     if (event.latLng) {
  //       this.markerPosition = event.latLng.toJSON();
  //       this.infoContent = `Clicked at: ${event.latLng.lat()}, ${event.latLng.lng()}`;
  //     }
  //   }

  openInfoWindow() {
    if (this.mapMarker) {
      this.infoWindow.open(this.mapMarker);
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    this.center = { lat, lng };
    this.markerPosition = this.center;

    // Reverse geocode clicked position
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        this.infoContent = `
          <strong>${results[0].formatted_address}</strong>
        `;
      } else {
        this.infoContent = 'No address found for this location.';
      }
    });
  }
}
